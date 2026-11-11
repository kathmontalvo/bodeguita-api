import { DomainException } from '../../../shared/domain/domain.exception';

export class InsufficientStockError extends DomainException {
  constructor(requested: number, available: number) {
    super(
      'INSUFFICIENT_STOCK',
      'CONFLICT',
      `Stock insuficiente: se pidieron ${requested} y solo hay ${available}`,
    );
  }
}
