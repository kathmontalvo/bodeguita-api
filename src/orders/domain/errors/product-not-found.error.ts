import { DomainException } from '../../../shared/domain/domain.exception';

/**
 * RN-007: cada ítem apunta a un producto existente. Lo lanza el handler de
 * PlaceOrder cuando StockChecker no encuentra el producto.
 */
export class ProductNotFoundError extends DomainException {
  constructor(productId: string) {
    super(
      'PRODUCT_NOT_FOUND',
      'NOT_FOUND',
      `No existe el producto ${productId}`,
    );
  }
}
