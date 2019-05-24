import { Inject, Injectable } from '@nestjs/common';
import { Query, Model } from 'mongoose';
import { UserDto } from './dto/user.dto';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(@Inject('USER_MODEL') private readonly userModel: Model<User>) { }

  async create(userDto: UserDto): Promise<User> {
    const user = new this.userModel(userDto);
    return await user.save();
  }

  async find(id: string): Promise<User> {
    const users = await this.userModel.find({ id }).exec();

    if (users.length > 0) {
      return users[0];
    }

    return undefined;
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async update(userDto: UserDto): Promise<Query<any>> {
    return await this.userModel.updateOne({ id: userDto.id }, userDto);
  }

  async remove(id: string): Promise<Query<any>> {
    return await this.userModel.deleteOne({ id });
  }
}
