import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class MentorFiltersDto {

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly tags: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly country: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly spokenLanguages: string;

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly name: string;

  constructor(values) {
    Object.assign(this, values);
  }
}
