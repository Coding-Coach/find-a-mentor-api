import { Module } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { UserActivityController } from './user-activity.controller';
import { CommonModule } from '../common/common.module';
import { DatabaseModule } from '../../database/database.module';
import { MentorshipsService } from '../mentorships/mentorships.service';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [UserActivityController],
  providers: [UserActivityService, MentorshipsService],
})
export class UserActivityModule {}
