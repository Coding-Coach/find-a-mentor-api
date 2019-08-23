import { ArgumentMetadata, PipeTransform, Injectable } from '@nestjs/common';
import Config from '../../../config';

@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value && metadata.type === 'query') {
      let page = parseInt(value.page, 10);
      let perpage = parseInt(value.perpage, 10);

      if (isNaN(page) || page <=0) {
        page = 1;
      }
      
      if (isNaN(perpage) || perpage <=0) {
        perpage = Config.pagination.perPage;
      }

      const offset = (page - 1) * perpage;

      return {
        ...value,
        page,
        perpage,
        offset,
      };
    }

    return value;
  }
}
