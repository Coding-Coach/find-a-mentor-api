import { Module } from '@nestjs/common';
import { MentorsController } from './mentors.controller';
import { MentorsService } from './mentors.service';
import { UsersModule } from '../users/users.module';
import { DatabaseModule } from '../../database/database.module';
import { applicationProviders } from './mentors.providers';

/**
 * Become a mentor module, Endpoints in this module are
 * defined to allow any user to become a mentor
 * by submiting their profiles for review
 */
@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [MentorsController],
  providers: [MentorsService, ...applicationProviders],
})
export class MentorsModule { }
