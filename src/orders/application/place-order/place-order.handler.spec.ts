import { EventBus } from '@nestjs/cqrs';
import { InsufficientStockError } from '../../domain/errors/insufficient-stock.error';
import { InvalidQuantityError } from '../../domain/errors/invalid-quantity.error';
import { OrderWithoutItemsError } from '../../domain/errors/order-without-items.error';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { OrderId } from '../../domain/value-objects/order-id.vo';
import { FakeStockChecker } from '../../infrastructure/testing/fake-stock-checker';
import { FixedClock } from '../../infrastructure/testing/fixed-clock';
import { InMemoryOrderRepository } from '../../infrastructure/testing/in-memory-order.repository';
import { PlaceOrderCommand } from './place-order.command';
import { PlaceOrderHandler } from './place-order.handler';

describe('PlaceOrderHandler', () => {
  const INCA = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';
  const ARROZ = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
  const NO_EXISTE = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
  const NOW = new Date('2026-11-11T15:30:00.000Z');

  let orders: InMemoryOrderRepository;
  let stockChecker: FakeStockChecker;
  let handler: PlaceOrderHandler;

  beforeEach(() => {
    orders = new InMemoryOrderRepository();
    stockChecker = new FakeStockChecker()
      .set(INCA, { stock: 10, priceCents: 350 })
      .set(ARROZ, { stock: 5, priceCents: 520 });
    // EventBus que no publica nada: estos tests no revisan el evento.
    const eventBus = { publishAll: jest.fn() } as unknown as EventBus;
    handler = new PlaceOrderHandler(
      orders,
      stockChecker,
      new FixedClock(NOW),
      eventBus,
    );
  });

  const place = (items: { productId: string; quantity: number }[]) =>
    handler.execute(new PlaceOrderCommand(items));

  const savedOrder = async (id: string) => {
    const order = await orders.findById(OrderId.create(id));
    if (!order) throw new Error('el pedido no se guardó');
    return order;
  };

  describe('pedido válido', () => {
    it('lo guarda con la fecha del Clock y devuelve su id', async () => {
      const { id } = await place([{ productId: INCA, quantity: 3 }]);

      const data = (await savedOrder(id)).toPrimitives();
      expect(data.id).toBe(id);
      expect(data.placedAt).toEqual(NOW);
    });

    it('RN-008: copia el precio de Catálogo y calcula el total', async () => {
      const { id } = await place([
        { productId: INCA, quantity: 3 },
        { productId: ARROZ, quantity: 2 },
      ]);

      const order = await savedOrder(id);
      expect(order.toPrimitives().items).toEqual([
        expect.objectContaining({
          productId: INCA,
          quantity: 3,
          unitPriceCents: 350,
        }),
        expect.objectContaining({
          productId: ARROZ,
          quantity: 2,
          unitPriceCents: 520,
        }),
      ]);
      expect(order.total().cents).toBe(3 * 350 + 2 * 520);
    });

    it('RN-008: si luego cambia el precio en Catálogo, el pedido no cambia', async () => {
      const { id } = await place([{ productId: INCA, quantity: 1 }]);

      stockChecker.set(INCA, { stock: 10, priceCents: 999 });

      const order = await savedOrder(id);
      expect(order.toPrimitives().items[0].unitPriceCents).toBe(350);
    });

    it('RN-006: acepta pedir exactamente el stock disponible', async () => {
      await expect(place([{ productId: ARROZ, quantity: 5 }])).resolves.toEqual(
        { id: expect.any(String) as string },
      );
    });
  });

  describe('errores', () => {
    it('RN-004: sin ítems → ORDER_WITHOUT_ITEMS y no consulta Catálogo', async () => {
      const spy = jest.spyOn(stockChecker, 'getAvailability');

      await expect(place([])).rejects.toThrow(OrderWithoutItemsError);

      expect(spy).not.toHaveBeenCalled();
      expect(orders.count()).toBe(0);
    });

    it('RN-005: cantidad inválida → 400 antes de consultar Catálogo', async () => {
      const spy = jest.spyOn(stockChecker, 'getAvailability');

      // Aunque el producto no existe, primero se valida la forma (400, no 404).
      await expect(
        place([{ productId: NO_EXISTE, quantity: 0 }]),
      ).rejects.toThrow(InvalidQuantityError);

      expect(spy).not.toHaveBeenCalled();
      expect(orders.count()).toBe(0);
    });

    it('RN-007: producto inexistente → PRODUCT_NOT_FOUND (404)', async () => {
      const error: unknown = await place([
        { productId: INCA, quantity: 1 },
        { productId: NO_EXISTE, quantity: 1 },
      ]).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ProductNotFoundError);
      expect(error).toMatchObject({
        code: 'PRODUCT_NOT_FOUND',
        kind: 'NOT_FOUND',
      });
      expect(orders.count()).toBe(0);
    });

    it('RN-006: más que el stock → INSUFFICIENT_STOCK (409)', async () => {
      const error: unknown = await place([
        { productId: ARROZ, quantity: 6 },
      ]).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(InsufficientStockError);
      expect(error).toMatchObject({
        code: 'INSUFFICIENT_STOCK',
        kind: 'CONFLICT',
      });
      expect(orders.count()).toBe(0);
    });

    it('RN-006: suma las líneas repetidas del mismo producto (3 + 3 > 5)', async () => {
      await expect(
        place([
          { productId: ARROZ, quantity: 3 },
          { productId: ARROZ, quantity: 3 },
        ]),
      ).rejects.toThrow(InsufficientStockError);

      expect(orders.count()).toBe(0);
    });
  });
});
