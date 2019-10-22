import { Module } from '@nestjs/common';
import { ListsController } from './lists.controller';
// import { ListService } from '../common/users.service';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [ListsController],
  // providers: [ListService],
})
export class ListsModule { }
