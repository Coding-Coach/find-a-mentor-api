import { Module } from '@nestjs/common';
import { MentorshipsController } from './mentorships.controller';
import { CommonModule } from '../common/common.module';
import { MentorsService } from '../common/mentors.service';
import { UsersService } from '../common/users.service';
import { DatabaseModule } from '../../database/database.module';
import { MentorshipsService } from './mentorships.service';
import { mentorshipsProviders } from './mentorships.providers';

/**
 * Mentorships module, Endpoints in this module are
 * defined to allow any user to request a mentorship from
 * and existing mentor, it will also host all endpoints to
 * allow a successfull mentorship.
 */
@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [MentorshipsController],
  providers: [
    MentorsService,
    UsersService,
    MentorshipsService,
    ...mentorshipsProviders,
  ],
})
export class MentorshipsModule {}
