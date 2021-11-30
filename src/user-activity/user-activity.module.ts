import { Module } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { UserActivityController } from './user-activity.controller';
import { CommonModule } from '../modules/common/common.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [UserActivityController],
  providers: [UserActivityService],
})
export class UserActivityModule {}
