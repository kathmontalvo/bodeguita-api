import { DomainException } from '../../../shared/domain/domain.exception';

export class InvalidProductIdError extends DomainException {
  constructor(value: string) {
    super(
      'INVALID_PRODUCT_ID',
      'VALIDATION',
      `ID de producto inválido: "${value}"`,
    );
  }
}
