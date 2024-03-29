import { UserDto } from './../common/dto/user.dto';
import {
  Body,
  BadRequestException,
  NotFoundException,
  Controller,
  Param,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
  Get,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiImplicitParam,
  ApiUseTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  Template,
  SendDataMentorshipParams,
  SendDataMentorshipApprovalParams,
  SendDataMentorshipRejectionParams,
} from '../email/interfaces/email.interface';
import { EmailService } from '../email/email.service';
import { MentorsService } from '../common/mentors.service';
import { UsersService } from '../common/users.service';
import { ChannelName, User, Role } from '../common/interfaces/user.interface';
import { MentorshipsService } from './mentorships.service';
import { MentorshipDto } from './dto/mentorship.dto';
import { Mentorship, Status } from './interfaces/mentorship.interface';
import { FindOneParams } from '../common/dto/findOneParams.dto';
import { MentorshipUpdatePayload } from './dto/mentorshipUpdatePayload.dto';
import { mentorshipsToDtos } from './mentorshipsToDto';

const ALLOWED_OPEN_MENTORSHIPS = 5;

@ApiUseTags('/mentorships')
@Controller('mentorships')
export class MentorshipsController {
  constructor(
    private readonly mentorsService: MentorsService,
    private readonly usersService: UsersService,
    private readonly mentorshipsService: MentorshipsService,
    private readonly emailService: EmailService,
  ) {}

  @Post(':mentorId/apply')
  @ApiOperation({
    title: 'Creates a new mentorship request for the given mentor',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async applyForMentorship(
    @Req() request: Request,
    @Param('mentorId') mentorId: string,
    @Body() data: MentorshipDto,
  ) {
    const [current, mentor] = await Promise.all([
      this.usersService.findByAuth0Id(request.user.auth0Id),
      this.mentorsService.findById(mentorId),
    ]);

    if (!mentor) {
      throw new BadRequestException('Mentor not found');
    }

    if (mentor._id.equals(current._id)) {
      throw new BadRequestException(`Are you planning to mentor yourself?`);
    }

    if (!mentor.available) {
      throw new BadRequestException('Mentor is not available');
    }

    const mentorship: Mentorship = await this.mentorshipsService.findMentorship(
      mentor._id,
      current._id,
    );

    if (mentorship) {
      throw new BadRequestException('A mentorship request already exists');
    }

    const openMentorships = await this.mentorshipsService.getOpenRequestsCount(
      current._id,
    );
    if (openMentorships >= ALLOWED_OPEN_MENTORSHIPS) {
      throw new BadRequestException(
        'You reached the maximum of open requests. Please wait a little longer for responses or cancel some of the requests',
      );
    }

    await this.mentorshipsService.createMentorship({
      mentor: mentor._id,
      mentee: current._id,
      status: Status.NEW,
      ...data,
    });

    try {
      await this.emailService.sendLocalTemplate({
        name: 'mentorship-requested',
        to: mentor.email,
        subject: 'Mentorship Requested',
        data: {
          mentorName: mentor.name,
          menteeName: current.name,
          menteeEmail: current.email,
          message: data.message,
          background: data.background,
          expectation: data.expectation,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
    }

    return {
      success: true,
    };
  }

  @Get(':userId/requests')
  @ApiBearerAuth()
  @ApiOperation({
    title: 'Returns the mentorship requests for a mentor or a mentee.',
  })
  async getMentorshipRequests(
    @Req() request: Request,
    @Param('userId') userId: string,
  ) {
    try {
      const [current, user]: [User, User] = await Promise.all([
        this.usersService.findByAuth0Id(request.user.auth0Id),
        this.usersService.findById(userId),
      ]);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Only an admin or same user can view the requests
      if (
        !current._id.equals(user._id) &&
        !current.roles.includes(Role.ADMIN)
      ) {
        throw new UnauthorizedException(
          'You are not authorized to perform this operation',
        );
      }

      // Get the mentorship requests from and to to that user
      const mentorshipRequests: Mentorship[] =
        await this.mentorshipsService.findMentorshipsByUser(userId);

      // Format the response data
      const requests = mentorshipsToDtos(mentorshipRequests, current);
      return {
        success: true,
        data: requests,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  @Put(':userId/requests/:id')
  @ApiOperation({
    title: 'Updates the mentorship status by the mentor or mentee',
  })
  @ApiBearerAuth()
  @ApiImplicitParam({ name: 'userId', description: `Mentor's id` })
  @ApiImplicitParam({ name: 'id', description: `Mentorship's id` })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateMentorship(
    @Req() request: Request,
    @Param() params: FindOneParams,
    @Body() data: MentorshipUpdatePayload,
  ) {
    const { reason, status } = data;
    const mentorship = await this.mentorshipsService.findMentorshipById(
      params.id,
    );

    if (!mentorship) {
      throw new NotFoundException('Mentorship not found');
    }

    const [currentUser, mentee, mentor] = await Promise.all([
      this.usersService.findByAuth0Id(request.user.auth0Id),
      this.usersService.findById(mentorship.mentee),
      this.usersService.findById(mentorship.mentor),
    ]);

    const currentUserIsAdmin = currentUser.roles.includes(Role.ADMIN);
    const currentUserIsMentor = currentUser._id.equals(mentorship.mentor);
    const currentUserIsMentee = currentUser._id.equals(mentorship.mentee);

    const canAccess =
      currentUserIsAdmin || currentUserIsMentee || currentUserIsMentor;
    if (!canAccess) {
      throw new UnauthorizedException();
    }

    const menteeUpdatableStatuses = [Status.CANCELLED] as string[];
    const mentorUpdatableStatuses = [
      Status.VIEWED,
      Status.APPROVED,
      Status.REJECTED,
    ] as string[];

    if (currentUserIsMentee && !menteeUpdatableStatuses.includes(status)) {
      throw new BadRequestException();
    }

    if (currentUserIsMentor && !mentorUpdatableStatuses.includes(status)) {
      throw new BadRequestException();
    }

    mentorship.status = status;
    if ([Status.CANCELLED, Status.REJECTED].includes(status) && reason) {
      mentorship.reason = reason;
    }

    try {
      await mentorship.save();
    } catch (error) {
      Sentry.captureException(error);
      return {
        success: false,
        error,
      };
    }

    try {
      const [menteeFirstName] = mentee.name.split(' ');

      if (mentorship.status === Status.APPROVED) {
        const slack = currentUser.channels.find(
          (channel) => channel.type === ChannelName.SLACK,
        );
        const contactURL = slack
          ? `https://coding-coach.slack.com/team/${slack.id}`
          : `mailto:${currentUser.email}`;

        const openRequests = await this.mentorshipsService.getOpenRequestsCount(
          mentee._id,
        );

        await this.emailService.sendLocalTemplate({
          to: mentee.email,
          name: 'mentorship-accepted',
          subject: 'Mentorship Approved 👏',
          data: {
            menteeName: menteeFirstName,
            mentorName: currentUser.name,
            openRequests,
            contactURL,
          },
        });
      }

      if (mentorship.status === Status.REJECTED) {
        await this.emailService.sendLocalTemplate({
          name: 'mentorship-declined',
          subject: 'Mentorship Declined',
          to: mentee.email,
          data: {
            menteeName: menteeFirstName,
            mentorName: currentUser.name,
            reason: reason || '',
            bySystem: false,
          },
        });
      }

      if (mentorship.status === Status.CANCELLED) {
        await this.emailService.sendLocalTemplate({
          name: 'mentorship-cancelled',
          to: mentor.email,
          subject: 'Mentorship Cancelled',
          data: {
            menteeName: currentUser.name,
            mentorName: mentor.name,
            reason: reason || '',
          },
        });
      }

      return {
        success: true,
        mentorship,
      };
    } catch (error) {
      Sentry.captureException(error);
      return {
        success: false,
        error,
      };
    }
  }

  //#region Admin
  @Get('requests')
  @ApiBearerAuth()
  @ApiOperation({
    title: 'Returns all the mentorship requests',
  })
  async getAllMentorshipRequests(@Req() request: Request) {
    try {
      const currentUser = await this.usersService.findByAuth0Id(
        request.user.auth0Id,
      );
      if (!currentUser.roles.includes(Role.ADMIN)) {
        throw new UnauthorizedException(
          'You are not authorized to perform this operation',
        );
      }

      const requests = await this.mentorshipsService.getAllMentorships({
        from: request.query.from,
      });
      const mentorshipRequests = mentorshipsToDtos(requests, currentUser);
      return {
        success: true,
        data: mentorshipRequests,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  @Put('requests/:id/reminder')
  @ApiBearerAuth()
  @ApiOperation({
    title: 'Send mentor a reminder about an open mentorship',
  })
  async sendMentorMentorshipReminder(
    @Req() request: Request,
    @Param() params: FindOneParams,
  ) {
    try {
      const currentUser = await this.usersService.findByAuth0Id(
        request.user.auth0Id,
      );

      if (!currentUser.roles.includes(Role.ADMIN)) {
        throw new UnauthorizedException(
          'You are not authorized to perform this operation',
        );
      }

      const mentorshipRequest =
        await this.mentorshipsService.findMentorshipById(params.id, true);

      const { mentor, mentee, message } = mentorshipRequest;
      mentorshipRequest.reminderSentAt = new Date();
      this.emailService.sendLocalTemplate({
        name: 'mentorship-reminder',
        to: mentor.email,
        subject: `Reminder - Mentorship requested`,
        data: {
          menteeName: mentee.name,
          mentorName: mentor.name,
          message,
        },
      });
      await mentorshipRequest.save();

      return {
        success: true,
      };
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }
  //#endregion
}
