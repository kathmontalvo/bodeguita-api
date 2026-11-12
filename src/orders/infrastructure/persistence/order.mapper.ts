import { Order } from '../../domain/order';
import { OrderItemOrmEntity } from './order-item.orm-entity';
import { OrderOrmEntity } from './order.orm-entity';

/**
 * Traduce entre el agregado Order (con sus OrderItem) y las filas de
 * orders + order_items. 
 */
export const OrderMapper = {
  /** Filas de la BD - Order. La fila debe venir con sus items cargados. */
  toDomain(row: OrderOrmEntity): Order {
    return Order.fromPrimitives({
      id: row.id,
      placedAt: row.placedAt,
      items: row.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })),
    });
  },

  /** Order - fila de orders con sus filas de order_items, lista para save(). */
  toOrm(order: Order): OrderOrmEntity {
    const { id, placedAt, items } = order.toPrimitives();

    const row = new OrderOrmEntity();
    row.id = id;
    row.placedAt = placedAt;
    row.items = items.map((item) => {
      const itemRow = new OrderItemOrmEntity();
      itemRow.id = item.id;
      itemRow.productId = item.productId;
      itemRow.quantity = item.quantity;
      itemRow.unitPriceCents = item.unitPriceCents;
      return itemRow;
    });
    return row;
  },
};
