import { Module } from '@nestjs/common';
import { Auth0Service } from './auth0.service';
import { UsersService } from './users.service';
import { commonProviders } from './common.providers';
import { DatabaseModule } from '../../database/database.module';
import { MentorsService } from './mentors.service';

@Module({
  imports: [DatabaseModule],
  providers: [MentorsService, UsersService, Auth0Service, ...commonProviders],
  exports: [MentorsService, UsersService, Auth0Service, ...commonProviders],
})
export class CommonModule { }
