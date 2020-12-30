import {
  Body,
  BadRequestException,
  Controller,
  Param,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  Template,
  SendDataMentorshipParams,
} from '../email/interfaces/email.interface';
import { EmailService } from '../email/email.service';
import { MentorsService } from '../common/mentors.service';
import { UsersService } from '../common/users.service';
import { User, Role } from '../common/interfaces/user.interface';
import { MentorshipsService } from './mentorships.service';
import { MentorshipDto } from './dto/mentorship.dto';
import { MentorshipSummaryDto } from './dto/mentorshipSummary.dto';
import { Mentorship, Status } from './interfaces/mentorship.interface';
import { UserSummaryDto } from './dto/userSummary.dto';

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
    const current: User = await this.usersService.findByAuth0Id(
      request.user.auth0Id,
    );
    const mentor: User = await this.mentorsService.findById(mentorId);

    if (!mentor) {
      throw new BadRequestException('Mentor not found');
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

    await this.mentorshipsService.createMentorship({
      mentor: mentor._id,
      mentee: current._id,
      status: Status.NEW,
      ...data,
    });

    try {
      const emailData = {
        to: mentor.email,
        templateId: Template.MENTORSHIP_REQUEST,
        name: current.name,
        message: data.message,
      };
      await this.emailService.send<SendDataMentorshipParams>(emailData);
    } catch (error) {
      Sentry.captureException(error);
    }

    return {
      success: true,
    };
  }

  @Get(':userId/requests')
  async getMentorshipRequests(
    @Req() request: Request,
    @Param('userId') userId: string,
  ) {
    const current: User = await this.usersService.findByAuth0Id(
      request.user.auth0Id,
    );
    const user: User = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only an admin or same user can view the requests
    if (!current._id.equals(user._id) && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException(
        'Not authorized to perform this operation',
      );
    }

    // get the mentorship requests from and to to that user
    const mentorshipRequests: Mentorship[] = await this.mentorshipsService.findMentorshipsByUser(
      userId,
    );

    // format the response data
    let requests = mentorshipRequests.map(item => {
      const mentorshipSummary = new MentorshipSummaryDto({
        id: item._id,
        status: item.status,
        message: item.message,
        background: item.background,
        expectation: item.expectation,
        date: item.createdAt,
        isMine: item.mentee.equals(current._id),
        user: new UserSummaryDto({
          id: item.mentee._id,
          avatar: item.mentee.avatar,
          title: item.mentee.title,
        }),
      });

      return mentorshipSummary;
    });

    return {
      success: true,
      data: requests,
    };
  }
}
