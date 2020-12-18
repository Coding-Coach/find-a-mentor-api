import { Inject, Injectable } from '@nestjs/common';
import { Query, Model } from 'mongoose';
import { Mentorship } from './interfaces/mentorship.interface';
import { MentorshipDto } from './dto/mentorship.dto';
import { isObjectId } from '../../utils/objectid';

@Injectable()
export class MentorshipsService {
  constructor(
    @Inject('MENTORSHIP_MODEL')
    private readonly mentorshipModel: Model<Mentorship>,
  ) {}

  /**
   * Creates a new mentorship request
   * @param mentorshipDto user's mentorship request
   */
  async createMentorship(mentorshipDto: MentorshipDto): Promise<Query<any>> {
    const mentorship = new this.mentorshipModel(mentorshipDto);
    return mentorship.save();
  }

  /**
   * Finds a mentorhip between a mentor and mentee
   * @param mentorId
   * @param menteeId
   */
  async findMentorship(
    mentorId: string,
    menteeId: string,
  ): Promise<Mentorship> {
    if (isObjectId(mentorId) && isObjectId(menteeId)) {
      return this.mentorshipModel
        .findOne({
          mentor: mentorId,
          mentee: menteeId,
        })
        .exec();
    }

    return Promise.resolve(null);
  }
}
