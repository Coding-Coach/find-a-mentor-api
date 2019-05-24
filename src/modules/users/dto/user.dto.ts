import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { Role } from '../interfaces/user.interface';

export class UserDto {
  @ApiModelProperty()
  readonly id: string;

  @ApiModelProperty()
  readonly email: string;

  @ApiModelProperty()
  readonly name: string;

  @ApiModelPropertyOptional()
  readonly avatar: string;

  @ApiModelPropertyOptional()
  readonly title: string;

  @ApiModelPropertyOptional()
  readonly description: string;

  @ApiModelPropertyOptional()
  readonly country: string;

  @ApiModelPropertyOptional()
  readonly spokenLanguages: string[];

  @ApiModelPropertyOptional()
  readonly tags: string[];
  
  @ApiModelPropertyOptional()
  readonly roles: Role[];

  constructor(values) {
    Object.assign(this, values);
  }
}
