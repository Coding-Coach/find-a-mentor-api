import {
  Controller,
  MethodNotAllowedException,
  NotFoundException,
  Put,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MentorsService } from '../common/mentors.service';
import { MentorshipsService } from '../mentorships/mentorships.service';
import { EmailService } from '../email/email.service';
import {
  Mentorship,
  Status,
} from '../mentorships/interfaces/mentorship.interface';
import { UsersService } from '../common/users.service';
import { UserRecordType } from '../common/interfaces/user-record.interface';
import { UserRecordDto } from '../common/dto/user-record.dto';
import { UserDto } from '../common/dto/user.dto';

const MONTH = 2.628e9;

@ApiUseTags('/admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mentorsService: MentorsService,
    private readonly emailService: EmailService,
    private readonly mentorshipsService: MentorshipsService,
  ) {}

  private respondedRecently(requestsAsMentor: Mentorship[]) {
    return requestsAsMentor.some(
      ({ status, updatedAt }) =>
        [Status.APPROVED, Status.REJECTED].includes(status) &&
        Date.now() - updatedAt.getTime() <= MONTH,
    );
  }

  @Put('mentor/:id/notActive')
  @ApiOperation({
    title: 'Send an email to not active mentor',
  })
  async mentorNotActive(@Req() request: Request) {
    const { id } = request.params;
    const mentor = await this.mentorsService.findById(id);
    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }
    const requestsAsMentor = (
      await this.mentorshipsService.findMentorshipsByUser(mentor._id)
    ).filter(({ mentor }) => mentor._id.equals(id));

    if (this.respondedRecently(requestsAsMentor)) {
      throw new MethodNotAllowedException('Mentor responded to some requests');
    }

    const record = this.usersService.addRecord(
      new UserRecordDto({
        user: mentor._id,
        type: UserRecordType.MentorNotResponding,
      }),
    );

    this.emailService.sendLocalTemplate({
      name: 'mentor-not-active',
      to: mentor.email,
      subject: 'Hi from CodingCoach, are you there?',
      data: {
        mentorName: mentor.name,
        numOfMentorshipRequests: requestsAsMentor.length,
      },
    });

    return {
      success: true,
      data: record,
    };
  }

  @Put('mentor/:id/freeze')
  @ApiOperation({
    title:
      'Retrieves a random mentor to be featured in the blog (or anywhere else)',
  })
  async freezeMentor(@Req() request: Request) {
    const { id } = request.params;
    const mentor = await this.mentorsService.findById(id);
    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }
    const requestsAsMentor = (
      await this.mentorshipsService.findMentorshipsByUser(mentor._id)
    ).filter(({ mentor }) => mentor._id.equals(id));

    if (this.respondedRecently(requestsAsMentor)) {
      throw new MethodNotAllowedException('Mentor responded to some requests');
    }

    this.usersService.update(
      new UserDto({
        _id: mentor._id,
        available: false,
      }),
    );

    this.emailService.sendLocalTemplate({
      name: 'mentor-freeze',
      to: mentor.email,
      subject: 'Seems like you are not here 😔',
      data: {
        mentorName: mentor.name,
      },
    });

    const mentorships = (
      await this.mentorshipsService.findMentorshipsByUser(id)
    ).filter(
      (mentorship) =>
        mentorship.mentor.id === id &&
        [Status.NEW, Status.VIEWED].includes(mentorship.status),
    );

    mentorships.forEach((mentorship) => {
      mentorship.status = Status.REJECTED;
      mentorship.reason = 'Automatic decline - Mentor is no longer available';
      (mentorship as any).save();

      this.emailService.sendLocalTemplate({
        to: mentorship.mentee.email,
        name: 'mentorship-declined',
        subject: 'Mentorship Declined – Mentor no longer available',
        data: {
          mentorName: mentorship.mentor.name,
          menteeName: mentorship.mentee.name,
          reason: mentorship.reason,
          bySystem: true,
        },
      });
    });

    return {
      success: true,
    };
  }
}
