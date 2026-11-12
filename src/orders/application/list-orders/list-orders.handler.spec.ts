import { Order } from '../../domain/order';
import { OrderId } from '../../domain/value-objects/order-id.vo';
import { InMemoryOrderRepository } from '../../infrastructure/testing/in-memory-order.repository';
import { ListOrdersHandler } from './list-orders.handler';

describe('ListOrdersHandler', () => {
  const INCA = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';
  const ARROZ = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

  let orders: InMemoryOrderRepository;
  let handler: ListOrdersHandler;

  beforeEach(() => {
    orders = new InMemoryOrderRepository();
    handler = new ListOrdersHandler(orders);
  });

  const placeAt = async (
    iso: string,
    items: { productId: string; quantity: number; unitPriceCents: number }[],
  ): Promise<string> => {
    const id = OrderId.generate();
    await orders.save(Order.place(id, items, new Date(iso)));
    return id.value;
  };

  it('devuelve una lista vacía si no hay pedidos', async () => {
    expect(await handler.execute()).toEqual([]);
  });

  it('devuelve los pedidos del más reciente al más antiguo, con montos en soles', async () => {
    const viejo = await placeAt('2026-11-10T10:00:00.000Z', [
      { productId: INCA, quantity: 2, unitPriceCents: 350 },
    ]);
    const nuevo = await placeAt('2026-11-11T10:00:00.000Z', [
      { productId: ARROZ, quantity: 1, unitPriceCents: 520 },
    ]);

    expect(await handler.execute()).toEqual([
      {
        id: nuevo,
        placedAt: '2026-11-11T10:00:00.000Z',
        items: [
          { productId: ARROZ, quantity: 1, unitPrice: 5.2, subtotal: 5.2 },
        ],
        total: 5.2,
      },
      {
        id: viejo,
        placedAt: '2026-11-10T10:00:00.000Z',
        items: [{ productId: INCA, quantity: 2, unitPrice: 3.5, subtotal: 7 }],
        total: 7,
      },
    ]);
  });
});
