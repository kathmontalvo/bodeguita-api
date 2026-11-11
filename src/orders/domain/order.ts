import { OrderWithoutItemsError } from './errors/order-without-items.error';
import { OrderPlaced } from './events/order-placed.event';
import {
  CreateOrderItemProps,
  OrderItem,
  OrderItemPrimitives,
} from './order-item';
import { Money } from './value-objects/money.vo';
import { OrderId } from './value-objects/order-id.vo';

/** Forma plana del pedido: la usan el mapper, el repositorio y las respuestas. */
export interface OrderPrimitives {
  id: string;
  placedAt: Date;
  items: OrderItemPrimitives[];
}

/** Eventos que puede registrar este agregado. */
export type OrderDomainEvent = OrderPlaced;

/** Agregado raíz del contexto de Pedidos. */
export class Order {
  private domainEvents: OrderDomainEvent[] = [];

  private constructor(
    private readonly id: OrderId,
    private readonly items: OrderItem[],
    private readonly placedAt: Date,
  ) {}

  /**
   * Registra un pedido nuevo.
   * - RN-004: al menos un ítem.
   * - RN-005: cada cantidad la valida Quantity dentro de OrderItem.
   * - placedAt viene del puerto Clock, nunca de new Date() aquí.
   * Deja registrado el evento OrderPlaced (aún no se publica).
   */
  static place(
    id: OrderId,
    items: CreateOrderItemProps[],
    placedAt: Date,
  ): Order {
    if (items.length === 0) {
      throw new OrderWithoutItemsError();
    }

    const order = new Order(
      id,
      items.map((item) => OrderItem.create(item)),
      new Date(placedAt.getTime()),
    );

    order.domainEvents.push(
      new OrderPlaced(
        id.value,
        items.map(({ productId, quantity }) => ({ productId, quantity })),
        new Date(placedAt.getTime()),
      ),
    );

    return order;
  }

  /** Reconstruye un pedido guardado: sin validar RN-004 de nuevo ni emitir eventos. */
  static fromPrimitives(data: OrderPrimitives): Order {
    return new Order(
      OrderId.create(data.id),
      data.items.map((item) => OrderItem.fromPrimitives(item)),
      new Date(data.placedAt.getTime()),
    );
  }

  /** RN-008: suma de precio × cantidad de cada ítem. */
  total(): Money {
    return this.items.reduce(
      (sum, item) => sum.add(item.subtotal()),
      Money.zero(),
    );
  }

  /**
   * Devuelve los eventos pendientes y los borra, para que no se publiquen
   * dos veces. El handler lo llama DESPUÉS de guardar el pedido.
   */
  pullDomainEvents(): OrderDomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = [];
    return events;
  }

  toPrimitives(): OrderPrimitives {
    return {
      id: this.id.value,
      placedAt: new Date(this.placedAt.getTime()),
      items: this.items.map((item) => item.toPrimitives()),
    };
  }
}
