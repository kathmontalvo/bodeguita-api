import { Order, OrderPrimitives } from '../../domain/order';
import { OrderRepository } from '../../domain/ports/order.repository';
import { OrderId } from '../../domain/value-objects/order-id.vo';

/**
 * Adaptador de prueba de OrderRepository: guarda los pedidos en un Map.
 * Guarda primitivos (no la instancia) para comportarse como una BD real.
 */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly rows = new Map<string, OrderPrimitives>();

  save(order: Order): Promise<void> {
    const data = order.toPrimitives();
    this.rows.set(data.id, data);
    return Promise.resolve();
  }

  findById(id: OrderId): Promise<Order | null> {
    const data = this.rows.get(id.value);
    return Promise.resolve(data ? Order.fromPrimitives(data) : null);
  }

  /** Solo para tests: cuántos pedidos hay guardados. */
  count(): number {
    return this.rows.size;
  }
}
