import { DomainException } from '../../../shared/domain/domain.exception';

/**
 * RN-006: no se pide más que el stock disponible. 
 */
export class InsufficientStockError extends DomainException {
  constructor(productId: string, requested: number, available: number) {
    super(
      'INSUFFICIENT_STOCK',
      'CONFLICT',
      `Stock insuficiente para el producto ${productId}: se pidieron ${requested} y solo hay ${available}`,
    );
  }
}
