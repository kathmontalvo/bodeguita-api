import { DomainException } from '../../../shared/domain/domain.exception';

/** RN-004: un pedido tiene al menos un ítem. */
export class OrderWithoutItemsError extends DomainException {
  constructor() {
    super(
      'ORDER_WITHOUT_ITEMS',
      'VALIDATION',
      'El pedido debe tener al menos un ítem',
    );
  }
}
