import { Module } from '@nestjs/common';
import { ListsController } from './lists.controller';
import { FavoritesController } from './favorites.controller';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../common/common.module';
import { ListsService } from './lists.service';
import { listsProviders } from './list.providers';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [FavoritesController, ListsController],
  providers: [ListsService, ...listsProviders],
})
export class ListsModule { }
