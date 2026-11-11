import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/ports/product.repository';
import { ProductResponse, toProductResponse } from '../product.response';
import { ListProductsQuery } from './list-products.query';

@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
  ) {}

  async execute(): Promise<ProductResponse[]> {
    const products = await this.products.findAll();
    return products.map(toProductResponse);
  }
}
