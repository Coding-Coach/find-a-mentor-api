import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { User } from '../../common/interfaces/user.interface';

export class ListDto {
  @ApiModelProperty()
  readonly _id: string;

  @ApiModelProperty()
  @IsString()
  @Length(3, 50)
  readonly name: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly public: boolean;

  @ApiModelPropertyOptional()
  @IsOptional()
  @IsArray()
  readonly mentors: User[];

  readonly user: User;
}
