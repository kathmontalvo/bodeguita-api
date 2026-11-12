import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../../products/domain/ports/product.repository';
import { ProductId } from '../../../products/domain/value-objects/product-id.vo';
import {
  ProductAvailability,
  StockChecker,
} from '../../domain/ports/stock-checker';

/**
 * Adaptador de StockChecker. Es el ÚNICO archivo de Orders que
 * importa algo de Products. El dominio y la aplicación de
 * Orders solo conocen el puerto StockChecker.
 */
@Injectable()
export class CatalogStockChecker implements StockChecker {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
  ) {}

  async getAvailability(
    productId: string,
  ): Promise<ProductAvailability | null> {
    const product = await this.products.findById(ProductId.create(productId));
    if (!product) return null;

    const { stock, priceCents } = product.toPrimitives();
    return { stock, priceCents };
  }
}
