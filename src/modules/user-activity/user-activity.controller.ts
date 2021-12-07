import { Controller, Get, Put } from '@nestjs/common';
import { MentorshipsService } from '../mentorships/mentorships.service';
import { UserActivityService } from './user-activity.service';

@Controller('user-activity')
export class UserActivityController {
  constructor(
    private readonly userActivityService: UserActivityService,
    private readonly mentorshipsService: MentorshipsService,
  ) {}

  @Put()
  async sendReminders() {
    const response = await this.userActivityService.getOrphandMentorships();
    await Promise.all(
      response.docs.map(async (mentorship) => {
        return this.mentorshipsService.sendMentorshipRequestReminder(
          mentorship._id,
        );
      }),
    );
  }
}
