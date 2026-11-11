import { DomainException } from '../../../shared/domain/domain.exception';

/** RN-005: la cantidad de cada ítem es un entero positivo. */
export class InvalidQuantityError extends DomainException {
  constructor(value: number) {
    super(
      'INVALID_QUANTITY',
      'VALIDATION',
      `Cantidad inválida: ${value}. Debe ser un entero mayor que 0`,
    );
  }
}
