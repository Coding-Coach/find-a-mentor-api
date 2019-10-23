import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { List } from './interfaces/list.interface';
import { ListDto } from './dto/list.dto';
import { isObjectId } from '../../utils/objectid';

@Injectable()
export class ListsService {
  constructor(
    @Inject('LIST_MODEL') private readonly listModel: Model<List>,
  ) { }

  async createList(data: ListDto): Promise<List> {
    const list = new this.listModel(data);
    return await list.save();
  }

  async findByUserId(_id: string): Promise<List[]> {
    if (isObjectId(_id)) {
      return await this.listModel.find({user: {_id}}).exec();
    }
  }
}
