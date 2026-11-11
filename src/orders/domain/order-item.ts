import { randomUUID } from 'node:crypto';
import { Money } from './value-objects/money.vo';
import { Quantity } from './value-objects/quantity.vo';

/** Forma plana del item: la usan el mapper y las respuestas. */
export interface OrderItemPrimitives {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export type CreateOrderItemProps = Omit<OrderItemPrimitives, 'id'>;

/**
 * Entidad DENTRO del agregado Order: tiene identidad propia (su fila en
 * order_items), pero solo se crea y se modifica a través de Order.
 */
export class OrderItem {
  private constructor(
    private readonly id: string,
    private readonly productId: string,
    private readonly quantity: Quantity,
    private readonly unitPrice: Money,
  ) {}

  /** Ítem nuevo: genera su id y valida la cantidad (RN-005). */
  static create(props: CreateOrderItemProps): OrderItem {
    return new OrderItem(
      randomUUID(),
      props.productId,
      Quantity.create(props.quantity),
      Money.create(props.unitPriceCents),
    );
  }

  /** Reconstruye un ítem guardado; conserva su id. */
  static fromPrimitives(data: OrderItemPrimitives): OrderItem {
    return new OrderItem(
      data.id,
      data.productId,
      Quantity.create(data.quantity),
      Money.create(data.unitPriceCents),
    );
  }

  /** RN-008: precio unitario × cantidad. */
  subtotal(): Money {
    return this.unitPrice.multiply(this.quantity);
  }

  toPrimitives(): OrderItemPrimitives {
    return {
      id: this.id,
      productId: this.productId,
      quantity: this.quantity.value,
      unitPriceCents: this.unitPrice.cents,
    };
  }
}
