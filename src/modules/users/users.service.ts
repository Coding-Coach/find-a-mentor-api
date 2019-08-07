import { Inject, Injectable } from '@nestjs/common';
import { Query, Model } from 'mongoose';
import { UserDto } from './dto/user.dto';
import { User } from './interfaces/user.interface';
import { isObjectId } from '../../utils/objectid';

@Injectable()
export class UsersService {
  constructor(@Inject('USER_MODEL') private readonly userModel: Model<User>) { }

  async create(userDto: UserDto): Promise<User> {
    const user = new this.userModel(userDto);
    return await user.save();
  }

  async findById(_id: string): Promise<User> {
    if (isObjectId(_id)) {
      return await this.userModel.findOne({ _id }).exec();
    }

    return Promise.resolve(null);
  }

  async findByAuth0Id(auth0Id: string): Promise<User> {
    return await this.userModel.findOne({ auth0Id }).exec();
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async update(userDto: UserDto): Promise<Query<any>> {
    return await this.userModel.updateOne({ _id: userDto._id }, userDto, {runValidators: true});
  }

  async remove(_id: string): Promise<Query<any>> {
    if (isObjectId(_id)) {
      return await this.userModel.deleteOne({ _id });
    }

    return Promise.resolve({
      ok: 0,
    });
  }
}
