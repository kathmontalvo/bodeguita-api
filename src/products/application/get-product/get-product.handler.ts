import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/ports/product.repository';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { ProductResponse, toProductResponse } from '../product.response';
import { GetProductQuery } from './get-product.query';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
  ) {}

  async execute(query: GetProductQuery): Promise<ProductResponse> {
    // Id que no es UUID → 400 INVALID_PRODUCT_ID (lo lanza ProductId).
    const id = ProductId.create(query.productId);

    const product = await this.products.findById(id);
    if (!product) {
      throw new ProductNotFoundError(id.value);
    }

    return toProductResponse(product);
  }
}
