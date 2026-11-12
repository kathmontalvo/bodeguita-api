import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderPlaced } from '../../../orders/domain/events/order-placed.event';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/ports/product.repository';
import { ProductId } from '../../domain/value-objects/product-id.vo';

/**
 * Adaptador de entrada de Products: escucha OrderPlaced (publicado por
 * Orders DESPUÉS de guardar el pedido) y descuenta el stock de cada producto.
 * Es lo único que modifica el stock por un pedido.
 */
@EventsHandler(OrderPlaced)
export class DecreaseStockOnOrderPlaced implements IEventHandler<OrderPlaced> {
  private readonly logger = new Logger(DecreaseStockOnOrderPlaced.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
  ) {}

  async handle(event: OrderPlaced): Promise<void> {
    // En serie, no en paralelo: si el pedido trae dos líneas del mismo
    // producto, la segunda lee el stock ya descontado por la primera.
    for (const { productId, quantity } of event.items) {
      try {
        const product = await this.products.findById(
          ProductId.create(productId),
        );
        if (!product) {
          this.logger.warn(
            `Pedido ${event.orderId}: el producto ${productId} ya no existe`,
          );
          continue;
        }

        // RN-003: Stock.decrease lanza InsufficientStockError antes de
        // dejarlo negativo (solo pasaría con dos pedidos simultáneos).
        product.decreaseStock(quantity);
        await this.products.save(product);
      } catch (error) {
        // El pedido ya está guardado y la respuesta HTTP ya salió: no hay a
        // quién devolverle el error. Se registra y se sigue con los demás.
        this.logger.error(
          `Pedido ${event.orderId}: no se pudo descontar ${quantity} de ${productId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}
