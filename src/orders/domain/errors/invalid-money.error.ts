import { DomainException } from '../../../shared/domain/domain.exception';

/**
 * Monto inválido en Pedidos. No debería pasar en la práctica: el precio
 * unitario se copia de Catálogo, que ya lo validó.
 */
export class InvalidMoneyError extends DomainException {
  constructor() {
    super(
      'INVALID_MONEY',
      'VALIDATION',
      'El monto debe ser un entero de céntimos mayor o igual a 0',
    );
  }
}
