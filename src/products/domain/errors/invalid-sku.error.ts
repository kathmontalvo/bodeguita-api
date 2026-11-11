import { DomainException } from '../../../shared/domain/domain.exception';

export class InvalidSkuError extends DomainException {
  constructor(value: string) {
    super('INVALID_SKU', 'VALIDATION', `SKU inválido: "${value}"`);
  }
}