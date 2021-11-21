import { UserDto } from './../../common/dto/user.dto';
import { Status } from '../interfaces/mentorship.interface';

export class MentorshipSummaryDto {
  readonly id: string;
  readonly status: Status;
  readonly message: string;
  readonly background: string;
  readonly expectation: string;
  readonly date: Date;
  readonly isMine: boolean;
  readonly mentor: UserDto;
  readonly mentee: UserDto;

  constructor(values) {
    Object.assign(this, values);
  }
}
