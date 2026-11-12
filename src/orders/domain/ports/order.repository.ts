import { Order } from '../order';
import { OrderId } from '../value-objects/order-id.vo';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

/**
 * Puerto de salida de Pedidos para guardar y leer pedidos.
 * findById devuelve null si no existe: el handler decide lanzar ORDER_NOT_FOUND.
 */
export interface OrderRepository {
  /** Guarda el pedido con todos sus ítems. */
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  /** Todos los pedidos, del más reciente al más antiguo. */
  findAll(): Promise<Order[]>;
}
