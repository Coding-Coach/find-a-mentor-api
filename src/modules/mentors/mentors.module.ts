import { Module } from '@nestjs/common';
import { MentorsController } from './mentors.controller';
import { CommonModule } from '../common/common.module';
import { MentorsService } from '../common/mentors.service';
import { UsersService } from '../common/users.service';
import { DatabaseModule } from '../../database/database.module';
import { EmailService } from '../email/email.service';

/**
 * Become a mentor module, Endpoints in this module are
 * defined to allow any user to become a mentor
 * by submiting their profiles for review
 */
@Module({
  imports: [DatabaseModule, CommonModule, EmailService],
  controllers: [MentorsController],
  providers: [MentorsService, EmailService, UsersService],
})
export class MentorsModule {}
