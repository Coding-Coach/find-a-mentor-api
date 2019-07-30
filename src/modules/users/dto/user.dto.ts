import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { 
  IsEmail,
  IsUrl,
  IsIn,
  IsOptional,
  Length,
  IsString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Role, Channel } from '../interfaces/user.interface';

export class UserDto {
  @ApiModelProperty()
  readonly _id: string;

  @ApiModelProperty()
  @IsEmail()
  @IsString()
  readonly email: string;

  @ApiModelProperty()
  @Length(3, 50)
  @IsString()
  readonly name: string;

  @ApiModelPropertyOptional()
  @IsString()
  @IsUrl()
  @IsOptional()
  readonly avatar: string;

  @ApiModelPropertyOptional()
  @Length(3, 50)
  @IsString()
  @IsOptional()
  readonly title: string;

  @ApiModelPropertyOptional()
  @Length(3, 140)
  @IsString()
  @IsOptional()
  readonly description: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsString()
  readonly country: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsString({
    each: true
  })
  readonly spokenLanguages: string[];

  @ApiModelPropertyOptional()
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({
    each: true
  })
  readonly tags: string[];

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsIn([Role.ADMIN, Role.MENTOR, Role.MEMBER], {
    each: true,
  })
  readonly roles: Role[];

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  readonly channels: Channel[];

  constructor(values) {
    Object.assign(this, values);
  }
}
