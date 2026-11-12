import { EventBus } from '@nestjs/cqrs';
import { InsufficientStockError } from '../../domain/errors/insufficient-stock.error';
import { OrderWithoutItemsError } from '../../domain/errors/order-without-items.error';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { OrderPlaced } from '../../domain/events/order-placed.event';
import { FakeStockChecker } from '../../infrastructure/testing/fake-stock-checker';
import { FixedClock } from '../../infrastructure/testing/fixed-clock';
import { InMemoryOrderRepository } from '../../infrastructure/testing/in-memory-order.repository';
import { PlaceOrderCommand } from './place-order.command';
import { PlaceOrderHandler } from './place-order.handler';

/** PlaceOrderHandler y la publicación del evento OrderPlaced. */
describe('PlaceOrderHandler · evento OrderPlaced', () => {
  const INCA = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';
  const ARROZ = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
  const NO_EXISTE = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
  const NOW = new Date('2026-11-11T15:30:00.000Z');

  let orders: InMemoryOrderRepository;
  let publishAll: jest.Mock<void, [OrderPlaced[]]>;
  let handler: PlaceOrderHandler;

  beforeEach(() => {
    orders = new InMemoryOrderRepository();
    publishAll = jest.fn<void, [OrderPlaced[]]>();
    const stockChecker = new FakeStockChecker()
      .set(INCA, { stock: 10, priceCents: 350 })
      .set(ARROZ, { stock: 5, priceCents: 520 });
    handler = new PlaceOrderHandler(orders, stockChecker, new FixedClock(NOW), {
      publishAll,
    } as unknown as EventBus);
  });

  const place = (items: { productId: string; quantity: number }[]) =>
    handler.execute(new PlaceOrderCommand(items));

  /** Eventos que recibió publishAll en su única llamada. */
  const published = (): OrderPlaced[] => {
    expect(publishAll).toHaveBeenCalledTimes(1);
    return publishAll.mock.calls[0][0];
  };

  describe('pedido válido', () => {
    it('publica un solo OrderPlaced con el id, los ítems y la fecha del pedido', async () => {
      const { id } = await place([
        { productId: INCA, quantity: 3 },
        { productId: ARROZ, quantity: 2 },
      ]);

      const events = published();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderPlaced);
      expect(events[0]).toEqual(
        new OrderPlaced(
          id,
          [
            { productId: INCA, quantity: 3 },
            { productId: ARROZ, quantity: 2 },
          ],
          NOW,
        ),
      );
    });

    it('publica DESPUÉS de guardar: cuando sale el evento, el pedido ya existe', async () => {
      let savedWhenPublished: number | undefined;
      publishAll.mockImplementation(() => {
        savedWhenPublished = orders.count();
      });

      await place([{ productId: INCA, quantity: 1 }]);

      expect(savedWhenPublished).toBe(1);
    });

    it('no reenvía eventos viejos: cada pedido publica solo el suyo', async () => {
      const first = await place([{ productId: INCA, quantity: 1 }]);
      const second = await place([{ productId: ARROZ, quantity: 1 }]);

      expect(publishAll).toHaveBeenCalledTimes(2);
      const [[firstEvents], [secondEvents]] = publishAll.mock.calls;
      expect(firstEvents.map((e) => e.orderId)).toEqual([first.id]);
      expect(secondEvents.map((e) => e.orderId)).toEqual([second.id]);
    });
  });

  describe('si el pedido no se registra, no publica nada', () => {
    it('RN-004: sin ítems', async () => {
      await expect(place([])).rejects.toThrow(OrderWithoutItemsError);
      expect(publishAll).not.toHaveBeenCalled();
    });

    it('RN-007: producto inexistente', async () => {
      await expect(
        place([{ productId: NO_EXISTE, quantity: 1 }]),
      ).rejects.toThrow(ProductNotFoundError);
      expect(publishAll).not.toHaveBeenCalled();
    });

    it('RN-006: stock insuficiente', async () => {
      await expect(place([{ productId: ARROZ, quantity: 6 }])).rejects.toThrow(
        InsufficientStockError,
      );
      expect(publishAll).not.toHaveBeenCalled();
    });

    it('si falla el save(), el error sube y el evento no sale', async () => {
      jest
        .spyOn(orders, 'save')
        .mockRejectedValue(new Error('se cayó la base de datos'));

      await expect(place([{ productId: INCA, quantity: 1 }])).rejects.toThrow(
        'se cayó la base de datos',
      );
      expect(publishAll).not.toHaveBeenCalled();
    });
  });
});
