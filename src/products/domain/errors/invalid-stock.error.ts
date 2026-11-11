import { DomainException } from '../../../shared/domain/domain.exception';

export class InvalidStockError extends DomainException {
  constructor(reason: string) {
    super('INVALID_STOCK', 'VALIDATION', `Stock inválido: ${reason}`);
  }
}
