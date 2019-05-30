import { Inject, Injectable } from '@nestjs/common';
import { Query, Model } from 'mongoose';
import { UserDto } from '../users/dto/user.dto';
import { User } from '../users/interfaces/user.interface';

@Injectable()
export class MentorsService {
  constructor(@Inject('USER_MODEL') private readonly userModel: Model<User>) { }

  async findAll(): Promise<User[]> {
    const filters = {
      roles: ['Mentor'],
    };

    return await this.userModel.find(filters).exec();
  }
}
