import { ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PaginationDto {
  @ApiModelPropertyOptional()
  @IsOptional()
  readonly page: number;

  @ApiModelPropertyOptional()
  @IsOptional()
  readonly limit: number;

  readonly offset: number;

  readonly total: number;

  readonly hasMore: boolean;

  constructor(values) {
    if (!values) {
      return;
    }

    Object.assign(this, values);
    this.hasMore =
      (values.page - 1) * values.limit + values.limit < values.total;
  }
}
