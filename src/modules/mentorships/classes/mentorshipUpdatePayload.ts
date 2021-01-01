import { IsIn, IsOptional, IsString } from 'class-validator';
import { Status } from '../interfaces/mentorship.interface';

export class MentorshipUpdatePayload {
  @IsIn([Status.VIEWED, Status.APPROVED, Status.REJECTED, Status.CANCELLED])
  status: string;

  @IsOptional()
  @IsString()
  reason: string;
}
