import { ApiModelProperty } from '@nestjs/swagger';
import {
  UserRecord,
  UserRecordType,
} from '../interfaces/user-record.interface';

export class UserRecordDto {
  @ApiModelProperty()
  readonly _id: string;

  @ApiModelProperty()
  readonly user: string;

  @ApiModelProperty()
  readonly type: UserRecordType;

  constructor(values: Partial<UserRecord>) {
    Object.assign(this, values);
  }
}
