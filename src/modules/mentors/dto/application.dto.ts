import { ApiModelProperty } from '@nestjs/swagger';
import { Length } from 'class-validator';

export class ApplicationDto {

  readonly _id: string;

  @ApiModelProperty()
  @Length(3, 200)
  readonly reason: string;

  constructor(values) {
    Object.assign(this, values);
  }
}
