import { Inject, Injectable } from '@nestjs/common';
import { Query, Model } from 'mongoose';
import { Mentorship } from './interfaces/mentorship.interface';
import { MentorshipDto } from './dto/mentorship.dto';

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
    return await mentorship.save();
  }
}
