import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../common/users.service';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../common/common.module';
import { MentorsService } from '../common/mentors.service';
import { EmailService } from '../email/email.service';

@Module({
  imports: [DatabaseModule, EmailService, CommonModule],
  controllers: [UsersController],
  providers: [MentorsService, UsersService, EmailService],
})
export class UsersModule { }
