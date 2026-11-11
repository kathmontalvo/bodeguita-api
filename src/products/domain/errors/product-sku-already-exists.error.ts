import { DomainException } from '../../../shared/domain/domain.exception';

/** RN-001: el SKU es único. Lo lanza el handler de CreateProduct. */
export class ProductSkuAlreadyExistsError extends DomainException {
  constructor(sku: string) {
    super(
      'PRODUCT_SKU_ALREADY_EXISTS',
      'CONFLICT',
      `Ya existe un producto con el SKU ${sku}`,
    );
  }
}
