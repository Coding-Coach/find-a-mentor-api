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

  readonly mentor: string;
  readonly mentee: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(Object.values(Status))
  readonly status: Status;

  @ApiModelProperty()
  @IsDefined()
  @IsString()
  @Length(3, 400)
  readonly message: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsArray()
  readonly goals: string[];

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 400)
  readonly expectation: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 400)
  readonly background: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 400)
  readonly reason: string;

  constructor(values) {
    Object.assign(this, values);
  }
}
