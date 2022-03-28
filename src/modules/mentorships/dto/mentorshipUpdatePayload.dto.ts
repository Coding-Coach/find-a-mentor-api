import { ApiModelPropertyOptional, ApiModelProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Status } from '../interfaces/mentorship.interface';

export class MentorshipUpdatePayload {
  @ApiModelProperty()
  @IsIn([Status.VIEWED, Status.APPROVED, Status.REJECTED, Status.CANCELLED])
  status: Status;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsString()
  reason: string;
}
