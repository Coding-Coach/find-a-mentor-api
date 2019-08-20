import { ArgumentMetadata, PipeTransform, Injectable } from '@nestjs/common';
import Config from '../../../config';

@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value && metadata.type === 'query') {
      let page = value.page || 1;
      let perpage = value.perpage || Config.pagination.perPage;

      if (page <=0) {
        page = 1;
      }
      
      if (perpage <=0) {
        perpage = Config.pagination.perPage;
      }

      const offset = (page - 1) * perpage;

      return {
        ...value,
        page,
        perpage: 0 + perpage,
        offset,
      };
    }

    return value;
  }
}
