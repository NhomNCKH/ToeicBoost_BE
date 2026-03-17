import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { IPaginatedResult, IPaginationOptions } from '../common/interfaces/pagination.interface';

export async function paginate<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions,
): Promise<IPaginatedResult<T>> {
  const { page = 1, limit = 20, sort = 'createdAt', order = 'DESC' } = options;

  const alias = queryBuilder.alias;
  const skip = (page - 1) * limit;

  const [data, total] = await queryBuilder
    .orderBy(`${alias}.${sort}`, order)
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
