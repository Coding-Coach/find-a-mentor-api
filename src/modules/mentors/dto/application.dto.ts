import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsString, IsIn, IsDefined } from 'class-validator';
import { Status } from '../interfaces/application.interface';

export class ApplicationDto {

  readonly _id: string;

  @ApiModelProperty()
  @IsDefined()
  @IsString()
  @IsIn([Status.APPROVED, Status.PENDING, Status.REJECTED])
  readonly status: Status;

  @ApiModelProperty()
  @IsString()
  @Length(3, 200)
  readonly description: string;
  
  @ApiModelProperty()
  @IsString()
  @Length(3, 200)
  readonly reason: string;

  constructor(values) {
    Object.assign(this, values);
  }
}
