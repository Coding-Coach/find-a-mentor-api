import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { List } from './interfaces/list.interface';
import { ListDto } from './dto/list.dto';

@Injectable()
export class ListsService {
  constructor(
    @Inject('LIST_MODEL') private readonly listModel: Model<List>,
  ) { }

  async createList(data: ListDto): Promise<List> {
    const list = new this.listModel(data);
    return await list.save();
  }
}
