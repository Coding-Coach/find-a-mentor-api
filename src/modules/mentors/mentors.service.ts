import { Inject, Injectable } from '@nestjs/common';
import { Query, Model } from 'mongoose';
import { MentorFiltersDto } from './dto/mentorfilters.dto';
import { ApplicationDto } from './dto/application.dto';
import { User } from '../users/interfaces/user.interface';
import { Application } from './interfaces/application.interface';
import { Status } from 'dist/modules/mentors/interfaces/application.interface';

@Injectable()
export class MentorsService {
  constructor(
    @Inject('USER_MODEL') private readonly userModel: Model<User>,
    @Inject('APPLICATION_MODEL') private readonly applicationModel: Model<Application>,
  ) { }

  /**
   * Search for mentors by the given filters
   * @param filters filters to apply
   */
  async findAll(filters: MentorFiltersDto): Promise<User[]> {
    const onlyMentors: any = {
      roles: 'Mentor',
    };

    if (filters.name) {
      onlyMentors.name = { $regex: filters.name, $options: 'i' };
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

  async findApplications(filters): Promise<Application> {
    return await this.applicationModel.find(filters).populate({ path: 'user', select: ['_id', 'name', 'avatar'] }).exec();
  }

  /**
   * Creates a new application for a user to become a mentor
   * @param applicationDto user's application
   */
  async createApplication(applicationDto: ApplicationDto): Promise<Query<any>> {
    const application = new this.applicationModel(applicationDto);
    return await application.save();
  }

  /**
   * Find a single application by the given user
   * @param user 
   */
  async findApplicationByUser(user: User): Promise<Application> {
    return await this.applicationModel.findOne({ user: user._id }).exec();
  }
}
