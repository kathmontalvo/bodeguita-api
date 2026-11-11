import { Command } from '@nestjs/cqrs';

export interface PlaceOrderItem {
  productId: string;
  quantity: number;
}

/**
 * Datos para registrar un pedido. No lleva precios: el precio de cada ítem
 * lo pone el sistema copiándolo de Catálogo (RN-008), nunca el cliente.
 */
export class PlaceOrderCommand extends Command<{ id: string }> {
  constructor(public readonly items: PlaceOrderItem[]) {
    super();
  }
}
