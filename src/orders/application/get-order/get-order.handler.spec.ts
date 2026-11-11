import { InvalidOrderIdError } from '../../domain/errors/invalid-order-id.error';
import { OrderNotFoundError } from '../../domain/errors/order-not-found.error';
import { Order } from '../../domain/order';
import { OrderId } from '../../domain/value-objects/order-id.vo';
import { InMemoryOrderRepository } from '../../infrastructure/testing/in-memory-order.repository';
import { GetOrderHandler } from './get-order.handler';
import { GetOrderQuery } from './get-order.query';

describe('GetOrderHandler', () => {
  const INCA = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';
  const ARROZ = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
  const PLACED_AT = new Date('2026-11-11T15:30:00.000Z');

  let orders: InMemoryOrderRepository;
  let handler: GetOrderHandler;

  beforeEach(() => {
    orders = new InMemoryOrderRepository();
    handler = new GetOrderHandler(orders);
  });

  it('devuelve el pedido con montos en soles, subtotales y total', async () => {
    const id = OrderId.generate();
    await orders.save(
      Order.place(
        id,
        [
          { productId: INCA, quantity: 3, unitPriceCents: 350 },
          { productId: ARROZ, quantity: 2, unitPriceCents: 520 },
        ],
        PLACED_AT,
      ),
    );

    const response = await handler.execute(new GetOrderQuery(id.value));

    expect(response).toEqual({
      id: id.value,
      placedAt: '2026-11-11T15:30:00.000Z',
      items: [
        { productId: INCA, quantity: 3, unitPrice: 3.5, subtotal: 10.5 },
        { productId: ARROZ, quantity: 2, unitPrice: 5.2, subtotal: 10.4 },
      ],
      total: 20.9,
    });
  });

  it('pedido inexistente → ORDER_NOT_FOUND (404)', async () => {
    const error: unknown = await handler
      .execute(new GetOrderQuery(OrderId.generate().value))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(OrderNotFoundError);
    expect(error).toMatchObject({ code: 'ORDER_NOT_FOUND', kind: 'NOT_FOUND' });
  });

  it('id que no es UUID → INVALID_ORDER_ID (400)', async () => {
    const error: unknown = await handler
      .execute(new GetOrderQuery('abc'))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(InvalidOrderIdError);
    expect(error).toMatchObject({
      code: 'INVALID_ORDER_ID',
      kind: 'VALIDATION',
    });
  });
});
