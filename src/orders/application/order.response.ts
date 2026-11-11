import { Order } from '../domain/order';

export interface OrderItemResponse {
  productId: string;
  quantity: number;
  unitPrice: number; // En soles: 3.5 = S/ 3.50 
  subtotal: number; // unitPrice × quantity, en soles 
}

export interface OrderResponse {
  id: string;
  placedAt: string;
  items: OrderItemResponse[];
  /** RN-008: suma de los subtotales */
  total: number;
}

const toSoles = (cents: number): number => cents / 100;

export function toOrderResponse(order: Order): OrderResponse {
  const { id, placedAt, items } = order.toPrimitives();
  return {
    id,
    placedAt: placedAt.toISOString(),
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: toSoles(item.unitPriceCents),
      subtotal: toSoles(item.unitPriceCents * item.quantity),
    })),
    total: toSoles(order.total().cents),
  };
}
