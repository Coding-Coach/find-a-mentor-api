import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PaginationDto {

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly page: number;

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly perpage: number;
  
  readonly offset: number;
  
  readonly total: number;
  
  readonly hasMore: boolean;

  constructor(values) {
    Object.assign(this, values);
    this.hasMore = (values.offset + values.perpage) < values.total;
  }
}
