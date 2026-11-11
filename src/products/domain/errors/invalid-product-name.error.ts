import { DomainException } from '../../../shared/domain/domain.exception';

export class InvalidProductNameError extends DomainException {
  constructor(reason: string) {
    super(
      'INVALID_PRODUCT_NAME',
      'VALIDATION',
      `Nombre de producto inválido: ${reason}`,
    );
  }
}
