import { ArgumentMetadata, PipeTransform, Injectable } from '@nestjs/common';
import Config from '../../../config';

@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value && metadata.type === 'query') {
      let page = parseInt(value.page, 10);
      let limit = parseInt(value.limit, 10);

      if (isNaN(page) || page <= 0) {
        page = 1;
      }

      if (isNaN(limit) || limit <= 0) {
        limit = Config.pagination.limit;
      }

      const offset = (page - 1) * limit;

      return {
        ...value,
        page,
        limit,
        offset,
      };
    }

    return value;
  }
}
