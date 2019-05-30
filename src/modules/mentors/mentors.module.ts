import { Module } from '@nestjs/common';
import { MentorsController } from './mentors.controller';
import { MentorsService } from './mentors.service';
import { usersProviders } from '../users/users.providers';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MentorsController],
  providers: [MentorsService, ...usersProviders],
})
export class MentorsModule { }
