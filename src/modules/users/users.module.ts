import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { usersProviders } from './users.providers';
import { DatabaseModule } from '../../database/database.module';
import { EmailService } from '../email/email.service';

@Module({
  imports: [DatabaseModule, EmailService],
  controllers: [UsersController],
  providers: [UsersService, EmailService, ...usersProviders],
  exports: [UsersService, ...usersProviders],
})
export class UsersModule { }
