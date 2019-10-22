import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { List } from './interfaces/list.interface';

@Injectable()
export class ListsService {
  constructor(
    @Inject('LIST_MODEL') private readonly listModel: Model<List>,
  ) { }

  async createList(): Promise<List> {
    return Promise.resolve(<List>{});
  }
}
