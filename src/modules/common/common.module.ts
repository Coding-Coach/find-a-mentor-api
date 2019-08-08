import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { commonProviders } from './common.providers';
import { DatabaseModule } from '../../database/database.module';
import { MentorsService } from './mentors.service';

@Module({
  imports: [DatabaseModule],
  providers: [MentorsService, UsersService, ...commonProviders],
  exports: [MentorsService, UsersService, ...commonProviders],
})
export class CommonModule { }
