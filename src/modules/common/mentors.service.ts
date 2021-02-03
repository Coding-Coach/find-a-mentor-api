import { Inject, Injectable } from '@nestjs/common';
import { Query, Model } from 'mongoose';
import { MentorFiltersDto } from './dto/mentorfilters.dto';
import { ApplicationDto } from './dto/application.dto';
import { FilterDto } from './dto/filter.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Role, User } from './interfaces/user.interface';
import { Application, Status } from './interfaces/application.interface';
import { isObjectId } from '../../utils/objectid';

@Injectable()
export class MentorsService {
  constructor(
    @Inject('USER_MODEL') private readonly userModel: Model<User>,
    @Inject('APPLICATION_MODEL')
    private readonly applicationModel: Model<Application>,
  ) {}

  /**
   * Finds a mentor by ID
   * @param _id
   */
  findById(_id: string): Promise<User> {
    if (isObjectId(_id)) {
      return this.userModel.findOne({ _id, roles: Role.MENTOR }).exec();
    }

    return Promise.resolve(null);
  }

  /**
   * Search for mentors by the given filters
   * @param filters filters to apply
   */
  async findAll(filters: MentorFiltersDto, isLoggedIn: boolean): Promise<any> {
    const onlyMentors: any = {
      roles: Role.MENTOR,
    };
    const projections = this.getMentorFields();

    if (isLoggedIn) {
      projections.channels = true;
    }

    if (filters.name) {
      onlyMentors.name = { $regex: filters.name, $options: 'i' };
    }

    if ('available' in filters) {
      onlyMentors.available = filters.available;
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

    const countries: FilterDto[] = await this.userModel.findUniqueCountries(
      onlyMentors,
    );
    const languages: FilterDto[] = await this.userModel.findUniqueLanguages(
      onlyMentors,
    );
    const technologies: FilterDto[] = await this.userModel
      .find(onlyMentors)
      .distinct('tags');
    const total: number = await this.userModel
      .find(onlyMentors)
      .countDocuments();
    const mentors: User[] = await this.userModel
      .find(onlyMentors)
      .select(projections)
      .skip(filters.offset)
      .limit(filters.limit)
      .sort({ createdAt: 'desc' })
      .exec();

    return {
      mentors: mentors.map(mentor => ({
        _id: mentor._id,
        available: mentor.available,
        spokenLanguages: mentor.spokenLanguages,
        tags: mentor.tags,
        name: mentor.name,
        avatar: mentor.avatar,
        title: mentor.title,
        description: mentor.description,
        country: mentor.country,
        createdAt: mentor.createdAt,
        channels: mentor.available ? mentor.channels : [],
      })),
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

  findApplications(filters): Promise<Application[]> {
    return this.applicationModel
      .find(filters)
      .populate({
        path: 'user',
        select: [
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
  createApplication(applicationDto: ApplicationDto): Promise<Query<any>> {
    const application = new this.applicationModel(applicationDto);
    return application.save();
  }

  updateApplication(application: ApplicationDto): Promise<Query<any>> {
    return this.applicationModel.updateOne(
      { _id: application._id },
      application,
    );
  }

  /**
   * Find a single application by the given user and status
   * @param user
   */
  findActiveApplicationByUser(user: User): Promise<Application> {
    return this.applicationModel
      .findOne({
        user: user._id,
        status: { $in: [Status.PENDING, Status.APPROVED] },
      })
      .exec();
  }

  findApplicationById(id: string): Promise<Application> {
    return this.applicationModel.findOne({ _id: id }).exec();
  }

  /**
   * Get a random mentor from the database
   */
  async findRandomMentor(): Promise<User> {
    const filter: any = { roles: 'Mentor' };
    const projections = this.getMentorFields();

    const total: number = await this.userModel.find(filter).countDocuments();
    const random: number = Math.floor(Math.random() * total);

    return this.userModel
      .findOne(filter)
      .select(projections)
      .skip(random)
      .exec();
  }

  removeAllApplicationsByUserId(user: string) {
    return this.applicationModel.deleteMany({ user }).exec();
  }

  getMentorFields(): any {
    const projections: any = {
      available: true,
      name: true,
      avatar: true,
      title: true,
      description: true,
      createdAt: true,
      tags: true,
      country: true,
      spokenLanguages: true,
    };

    return projections;
  }
}
