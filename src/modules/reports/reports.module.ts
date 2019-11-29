import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { UsersService } from '../common/users.service';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [ReportsController],
  providers: [UsersService],
})
export class ReportsModule { }
