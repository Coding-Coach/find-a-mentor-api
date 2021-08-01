import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CommonModule } from '../common/common.module';
import { MentorsService } from '../common/mentors.service';
import { DatabaseModule } from '../../database/database.module';
import { EmailService } from '../email/email.service';
import { UsersService } from '../common/users.service';
import { MentorshipsService } from '../mentorships/mentorships.service';

/**
 * Admin module, Endpoints in this module are
 * defined to allow admin to run some priviliage operations
 */
@Module({
  imports: [DatabaseModule, CommonModule, EmailService],
  controllers: [AdminController],
  providers: [MentorsService, EmailService, UsersService, MentorshipsService],
})
export class AdminModule {}
