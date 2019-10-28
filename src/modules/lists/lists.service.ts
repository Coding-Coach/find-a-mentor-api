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

  async findByUserId(params: any): Promise<List[]> {
    const filters: any = {};
    if (params.userId) {
      filters.user = { _id: params.userId };
    }
    if (params.public) {
      filters.public = { public: params.public };
    }

    if (filters.public !== undefined) {
      filters.public = params.public;
    }

    // TODO: Add more filters here later on (as we need them)

    return await this.listModel.find(filters).exec();
  }
}
