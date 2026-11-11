import { DomainException } from '../../../shared/domain/domain.exception';

/** GET /orders/:id con un id que no es UUID → 400. */
export class InvalidOrderIdError extends DomainException {
  constructor(value: string) {
    super(
      'INVALID_ORDER_ID',
      'VALIDATION',
      `ID de pedido inválido: "${value}"`,
    );
  }
}
