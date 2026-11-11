import { DomainException } from '../../../shared/domain/domain.exception';

/** GET /orders/:id de un pedido que no existe. Lo lanza el handler. */
export class OrderNotFoundError extends DomainException {
  constructor(id: string) {
    super('ORDER_NOT_FOUND', 'NOT_FOUND', `No existe el pedido ${id}`);
  }
}
