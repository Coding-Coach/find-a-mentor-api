import { Inject, Injectable } from '@nestjs/common';
import { Query, Model } from 'mongoose';
import { MentorFiltersDto } from './dto/mentorfilters.dto';
import { ApplicationDto } from './dto/application.dto';
import { FilterDto } from './dto/filter.dto';
import { PaginationDto } from './dto/pagination.dto';
import { User } from './interfaces/user.interface';
import { Application, Status } from './interfaces/application.interface';

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
  async findAll(filters: MentorFiltersDto, isLoggedIn: boolean): Promise<any> {
    const onlyMentors: any = {
      roles: 'Mentor',
    };
    const projections = this.getMentorFields(isLoggedIn);

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

    const countries: FilterDto[] = await this.userModel.findUniqueCountries(onlyMentors);
    const languages: FilterDto[] = await this.userModel.findUniqueLanguages(onlyMentors);
    const technologies: FilterDto[] = await this.userModel.find(onlyMentors).distinct('tags');
    const total: number = await this.userModel.find(onlyMentors).countDocuments();
    const mentors: User[] = await this.userModel.find(onlyMentors)
      .select(projections)
      .skip(filters.offset)
      .limit(filters.limit)
      .sort({ createdAt: 'desc' })
      .exec();

    return {
      mentors,
      pagination: new PaginationDto({
        total,
        page: filters.page,
        limit: filters.limit,
      }),
      filters: {
        countries,
        languages,
        technologies: technologies.sort(),
      },
    };
  }

  async findApplications(filters): Promise<Application[]> {
    return await this.applicationModel
      .find(filters)
      .populate({
        path: 'user', select: [
          '_id',
          'name',
          'email',
          'avatar',
          'channels',
          'country',
          'createdAt',
          'description',
          'roles',
          'spokenLanguages',
          'tags',
          'title',
        ],
      })
      .exec();
  }

  /**
   * Creates a new application for a user to become a mentor
   * @param applicationDto user's application
   */
  async createApplication(applicationDto: ApplicationDto): Promise<Query<any>> {
    const application = new this.applicationModel(applicationDto);
    return await application.save();
  }

  async updateApplication(application: ApplicationDto): Promise<Query<any>> {
    return await this.applicationModel.updateOne({ _id: application._id }, application);
  }

  /**
   * Find a single application by the given user and status
   * @param user
   */
  async findActiveApplicationByUser(user: User): Promise<Application> {
    return await this.applicationModel.findOne({ user: user._id, status: { $in: [Status.PENDING, Status.APPROVED]} }).exec();
  }

  async findApplicationById(id: string): Promise<Application> {
    return await this.applicationModel.findOne({ _id: id }).exec();
  }

  /**
   * Get a random mentor from the database
   */
  async findRandomMentor(isLoggedIn: boolean): Promise<User> {
    const filter: any = { roles: 'Mentor' };
    const projections = this.getMentorFields(isLoggedIn);

    const total: number = await this.userModel.find(filter).countDocuments();
    const random: number = Math.floor(Math.random() * total);

    return await this.userModel
      .findOne(filter)
      .select(projections)
      .skip(random)
      .exec();
  }

  async removeAllApplicationsByUserId(user: string) {
    return await this.applicationModel.deleteMany({ user }).exec();
  }

  getMentorFields(isLoggedIn: boolean): any {
    let projections: any = {
      name: true,
      avatar: true,
      title: true,
      description: true,
      createdAt: true,
      tags: true,
      country: true,
      spokenLanguages: true,
    };

    // We need to return channels for logged in users only
    if (isLoggedIn) {
      projections = {
        ...projections,
        email: true,
        channels: true,
      };
    }

    return projections;
  }
}
