import { Status } from '../interfaces/mentorship.interface';

import { UserSummaryDto } from './userSummary.dto';

export class MentorshipSummaryDto {
  readonly id: string;
  readonly status: Status;
  readonly message: string;
  readonly background: string;
  readonly expectation: string;
  readonly date: Date;
  readonly isMine: Boolean;
  readonly user: UserSummaryDto;

  constructor(values) {
    Object.assign(this, values);
  }
}
