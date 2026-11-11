import { Query } from '@nestjs/cqrs';
import { ProductResponse } from '../product.response';

export class ListProductsQuery extends Query<ProductResponse[]> {}
