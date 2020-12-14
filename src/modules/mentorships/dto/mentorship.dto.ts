import { ApiModelPropertyOptional, ApiModelProperty } from '@nestjs/swagger';
import {
  Length,
  IsString,
  IsIn,
  IsDefined,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Status } from '../interfaces/mentorship.interface';

export class MentorshipDto {
  readonly _id: string;

  readonly mentor: String;
  readonly mentee: String;

  @ApiModelProperty()
  @IsDefined()
  @IsString()
  @IsIn([
    Status.NEW,
    Status.VIEWED,
    Status.APPROVED,
    Status.REJECTED,
    Status.TERMINATED,
  ])
  readonly status: Status;

  @ApiModelProperty()
  @IsString()
  @Length(3, 400)
  readonly message: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsArray()
  readonly goals: String[];

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 400)
  readonly expectation: String;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 400)
  readonly background: String;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 400)
  readonly reason: string;

  constructor(values) {
    Object.assign(this, values);
  }
}
