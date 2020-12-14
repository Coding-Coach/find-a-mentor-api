import { Module } from '@nestjs/common';
import { MentorshipController } from './mentorships.controller';
import { CommonModule } from '../common/common.module';
import { MentorsService } from '../common/mentors.service';
import { UsersService } from '../common/users.service';
import { DatabaseModule } from '../../database/database.module';
import { EmailService } from '../email/email.service';

/**
 * Mentorships module, Endpoints in this module are
 * defined to allow any user to request a mentorship from
 * and existing mentor, it will also host all endpoints to
 * allow a successfull mentorship.
 */
@Module({
  imports: [DatabaseModule, CommonModule, EmailService],
  controllers: [MentorshipController],
  providers: [MentorsService, EmailService, UsersService],
})
export class MentorshipsModule {}
