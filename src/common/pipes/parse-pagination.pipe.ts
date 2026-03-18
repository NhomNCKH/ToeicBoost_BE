import { Injectable, PipeTransform } from '@nestjs/common';
import { APP_CONSTANTS } from '../constants/app.constant';
import { IPaginationOptions } from '../interfaces/pagination.interface';

@Injectable()
export class ParsePaginationPipe implements PipeTransform<
  Record<string, string>,
  IPaginationOptions
> {
  transform(value: Record<string, string>): IPaginationOptions {
    const page = Math.max(
      parseInt(value.page, 10) || APP_CONSTANTS.DEFAULT_PAGE,
      1,
    );
    const limit = Math.min(
      Math.max(parseInt(value.limit, 10) || APP_CONSTANTS.DEFAULT_LIMIT, 1),
      APP_CONSTANTS.MAX_LIMIT,
    );
    const sort = value.sort || 'createdAt';
    const order =
      value.order?.toUpperCase() === 'ASC'
        ? ('ASC' as const)
        : ('DESC' as const);

    return { page, limit, sort, order };
  }
}
