import { DomainException } from '../../../shared/domain/domain.exception';

/**
 * RN-002. El mensaje no menciona céntimos: quien usa la API envía el precio
 * en soles, y los céntimos son un detalle interno del dominio.
 */
export class InvalidPriceError extends DomainException {
  constructor() {
    super('INVALID_PRICE', 'VALIDATION', 'El precio debe ser mayor que 0');
  }
}
