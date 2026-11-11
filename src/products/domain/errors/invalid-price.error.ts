import { DomainException } from '../../../shared/domain/domain.exception';

export class InvalidPriceError extends DomainException {
  constructor(cents: number) {
    super(
      'INVALID_PRICE',
      'VALIDATION',
      `Precio inválido: ${cents}. Debe ser un entero en céntimos mayor que 0`,
    );
  }
}
