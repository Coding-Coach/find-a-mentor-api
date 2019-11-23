import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class MentorFiltersDto extends PaginationDto {
  // Private fields used internally only
  readonly available: boolean;

  // Public filters that can be set from clients
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
}
