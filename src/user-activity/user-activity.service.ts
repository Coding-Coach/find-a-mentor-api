import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Mentorship } from '../modules/mentorships/interfaces/mentorship.interface';

const REMINDER_DAYS_AGO = 7;
const day = 1000 * 60 * 60 * 24;

@Injectable()
export class UserActivityService {
  @Inject('MENTORSHIP_MODEL')
  private readonly mentorshipModel: Model<Mentorship>;
  constructor() {}

  getOrphandMentorships() {
    const now = Date.now();
    return this.mentorshipModel.aggregate([
      // filter 7 days old mentorships
      {
        $match: {
          createdAt: {
            $gte: new Date(now - day * REMINDER_DAYS_AGO),
            $lt: new Date(now - day * (REMINDER_DAYS_AGO - 1)),
          },
        },
      },
      // group by mentee
      {
        $group: {
          _id: '$mentee',
          docs: {
            $push: '$$ROOT',
          },
        },
      },
      // filter mentee with accepted mentorships
      {
        $match: {
          docs: {
            $not: {
              $elemMatch: {
                status: 'Accepted',
              },
            },
          },
        },
      },
      // {
      //   $redact: {
      //     $cond: {
      //       if: { $eq: [ "$status", 'New' ]},
      //       then: "$$DESCEND",
      //       else: "$$PRUNE"
      //     }
      //   }
      // }
      // { "$unwind": "$docs" },
      // {
      //   $match: {
      //     docs: {

      //     }
      //   }
      // }
    ]);
  }
}
