import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../common/users.service';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../common/common.module';
import { MentorsService } from '../common/mentors.service';
import { ListsModule } from '../lists/lists.module';
import { ListsService } from '../lists/lists.service';
import { EmailService } from '../email/email.service';

@Module({
  imports: [DatabaseModule, EmailService, CommonModule, ListsModule],
  controllers: [UsersController],
  providers: [MentorsService, UsersService, EmailService, ListsService],
})
export class UsersModule {}
