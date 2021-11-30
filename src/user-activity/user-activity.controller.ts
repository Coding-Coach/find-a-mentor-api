import { Controller, Get, Put } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';

@Controller('user-activity')
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService) {}

  @Put()
  async sendReminders() {
    const list = await this.userActivityService.getOrphandMentorships();
    console.log(JSON.stringify(list, null, 2));
  }
}
