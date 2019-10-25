import { Inject, Injectable } from '@nestjs/common';
import { Query, Model } from 'mongoose';
import { List } from './interfaces/list.interface';
import { ListDto } from './dto/list.dto';
import { User } from '../common/interfaces/user.interface';

@Injectable()
export class ListsService {
  constructor(
    @Inject('LIST_MODEL') private readonly listModel: Model<List>,
  ) { }

  /**
   * Creates a new list in the database
   */
  async createList(data: ListDto): Promise<List> {
    const list = new this.listModel(data);
    return await list.save();
  }

  /**
   * Updates an existing list
   */
  async update(list: ListDto): Promise<Query<any>> {
    return await this.listModel.updateOne({ _id: list._id }, list, { runValidators: true });
  }

  /**
   * Find the favorite list for the given user
   */
  async findFavoriteList(user: User): Promise<List> {
    return await this.listModel.findOne({ user: user._id, isFavorite: true }).exec();
  }
}
