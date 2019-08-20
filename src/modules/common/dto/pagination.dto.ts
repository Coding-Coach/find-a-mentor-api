import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import Config from '../../../config';

export class PaginationDto {

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly page: number;

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly perpage: number;
  
  readonly offset: number;
}
