import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsUrl, IsIn, IsOptional, Length } from 'class-validator';
import { Role } from '../interfaces/user.interface';

export class UserDto {
  @ApiModelProperty()
  readonly _id: string;

  @ApiModelProperty()
  @IsEmail()
  readonly email: string;

  @ApiModelProperty()
  @Length(3, 50)
  readonly name: string;

  @ApiModelPropertyOptional()
  @IsUrl()
  @IsOptional()
  readonly avatar: string;

  @ApiModelPropertyOptional()
  @Length(3, 50)
  @IsOptional()
  readonly title: string;

  @ApiModelPropertyOptional()
  @Length(3, 140)
  @IsOptional()
  readonly description: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly country: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly spokenLanguages: string[];

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly tags: string[];

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsIn([Role.ADMIN, Role.MENTOR, Role.MEMBER], {
    each: true,
  })
  readonly roles: Role[];

  constructor(values) {
    Object.assign(this, values);
  }
}
