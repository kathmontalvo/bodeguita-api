import { DomainException } from '../../../shared/domain/domain.exception';

export class ProductNotFoundError extends DomainException {
  constructor(id: string) {
    super('PRODUCT_NOT_FOUND', 'NOT_FOUND', `No existe el producto ${id}`);
  }
}
