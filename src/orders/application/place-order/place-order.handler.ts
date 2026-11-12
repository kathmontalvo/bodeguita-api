import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { InsufficientStockError } from '../../domain/errors/insufficient-stock.error';
import { OrderWithoutItemsError } from '../../domain/errors/order-without-items.error';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { Order } from '../../domain/order';
import { CLOCK, type Clock } from '../../domain/ports/clock';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../domain/ports/order.repository';
import {
  type ProductAvailability,
  STOCK_CHECKER,
  type StockChecker,
} from '../../domain/ports/stock-checker';
import { OrderId } from '../../domain/value-objects/order-id.vo';
import { Quantity } from '../../domain/value-objects/quantity.vo';
import { PlaceOrderCommand, PlaceOrderItem } from './place-order.command';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler implements ICommandHandler<PlaceOrderCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(STOCK_CHECKER) private readonly stockChecker: StockChecker,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<{ id: string }> {
    // 1. Forma del pedido primero (400), antes de consultar Products
    if (command.items.length === 0) {
      throw new OrderWithoutItemsError();
    }
    command.items.forEach((item) => Quantity.create(item.quantity));

    // 2. RN-007 y RN-006 contra Products (404 / 409).
    const availability = await this.checkAvailability(command.items);

    // 3. RN-008: el precio se copia de Products en este momento.
    const order = Order.place(
      OrderId.generate(),
      command.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: availability.get(item.productId)!.priceCents,
      })),
      this.clock.now(),
    );

    await this.orders.save(order);

    // 4. Solo DESPUÉS de guardar se publica OrderPlaced: si save() falla, nadie
    // se entera de un pedido que no existe. Products lo escucha y descuenta stock.
    this.eventBus.publishAll(order.pullDomainEvents());

    return { id: order.toPrimitives().id };
  }

  /**
   * Consulta cada producto UNA vez y compara contra la cantidad TOTAL pedida
   * de ese producto.
   */
  private async checkAvailability(
    items: PlaceOrderItem[],
  ): Promise<Map<string, ProductAvailability>> {
    const requested = new Map<string, number>();
    for (const { productId, quantity } of items) {
      requested.set(productId, (requested.get(productId) ?? 0) + quantity);
    }

    const result = new Map<string, ProductAvailability>();
    for (const [productId, quantity] of requested) {
      const product = await this.stockChecker.getAvailability(productId);
      if (!product) {
        throw new ProductNotFoundError(productId);
      }
      if (quantity > product.stock) {
        throw new InsufficientStockError(productId, quantity, product.stock);
      }
      result.set(productId, product);
    }
    return result;
  }
}
