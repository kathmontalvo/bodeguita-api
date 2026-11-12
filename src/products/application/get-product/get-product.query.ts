import { Query } from '@nestjs/cqrs';
import { ProductResponse } from '../product.response';

export class GetProductQuery extends Query<ProductResponse> {
  constructor(public readonly productId: string) {
    super();
  }
}
