import { Inject, Injectable } from '@nestjs/common';
import { Query, Model } from 'mongoose';
import { MentorFiltersDto } from './dto/mentorfilters.dto';
import { UserDto } from '../users/dto/user.dto';
import { User } from '../users/interfaces/user.interface';

@Injectable()
export class MentorsService {
  constructor(@Inject('USER_MODEL') private readonly userModel: Model<User>) { }

  async findAll(filters: MentorFiltersDto): Promise<User[]> {
    const onlyMentors:any = {
      roles: 'Mentor',
    };

    if (filters.name) {
      onlyMentors.name = { '$regex': filters.name, '$options': 'i' };
    }

    if (filters.tags) {
      onlyMentors.tags = { $all: filters.tags.split(',') };
    }
    
    if (filters.country) {
      onlyMentors.country = filters.country;
    }
    
    if (filters.spokenLanguages) {
      onlyMentors.spokenLanguages = filters.spokenLanguages;
    }

    return await this.userModel.find(onlyMentors).exec();
  }
}
