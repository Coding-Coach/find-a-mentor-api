import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { User, Role } from '../common/interfaces/user.interface';
import { Totals } from './interfaces/totals.interface';

@Injectable()
export class ReportsService {
  constructor(
    @Inject('USER_MODEL') private readonly userModel: Model<User>,
  ) { }

  async totalsByRole(start: string, end: string): Promise<Totals> {
    const dates: any = {};

    if (start || end) {
      dates.createdAt = {};

      if (start) {
        dates.createdAt.$gte = start;
      }

      if (end) {
        dates.createdAt.$lt = end;
      }
    }

    const total: number = await this.userModel.find().countDocuments();
    const admins: number = await this.userModel.find({ roles: Role.ADMIN, ...dates }).countDocuments();
    const members: number = await this.userModel.find({ roles: [Role.MEMBER], ...dates }).countDocuments();
    const mentors: number = await this.userModel.find({ roles: Role.MENTOR, ...dates }).countDocuments();

    return {
      total,
      admins,
      members,
      mentors,
    } as Totals;
  }
}
