import { captureError } from '../../shared/testing/capture-error';
import { InvalidQuantityError } from './errors/invalid-quantity.error';
import { OrderWithoutItemsError } from './errors/order-without-items.error';
import { OrderPlaced } from './events/order-placed.event';
import { Order, OrderPrimitives } from './order';
import { OrderId } from './value-objects/order-id.vo';

describe('Order', () => {
  const INCA = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';
  const ARROZ = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
  const PLACED_AT = new Date('2026-11-11T15:30:00.000Z');

  const items = [
    { productId: INCA, quantity: 3, unitPriceCents: 350 },
    { productId: ARROZ, quantity: 2, unitPriceCents: 520 },
  ];

  describe('place', () => {
    it('crea el pedido con su id, fecha e ítems', () => {
      const id = OrderId.generate();

      const data = Order.place(id, items, PLACED_AT).toPrimitives();

      expect(data.id).toBe(id.value);
      expect(data.placedAt).toEqual(PLACED_AT);
      expect(data.items).toHaveLength(2);
      expect(data.items[0]).toMatchObject(items[0]);
      expect(data.items[1]).toMatchObject(items[1]);
    });

    it('RN-004: sin ítems lanza ORDER_WITHOUT_ITEMS (400)', () => {
      const error = captureError(() =>
        Order.place(OrderId.generate(), [], PLACED_AT),
      );

      expect(error).toBeInstanceOf(OrderWithoutItemsError);
      expect(error).toMatchObject({
        code: 'ORDER_WITHOUT_ITEMS',
        kind: 'VALIDATION',
      });
    });

    it('RN-005: una cantidad inválida impide crear el pedido', () => {
      expect(() =>
        Order.place(
          OrderId.generate(),
          [{ productId: INCA, quantity: 0, unitPriceCents: 350 }],
          PLACED_AT,
        ),
      ).toThrow(InvalidQuantityError);
    });

    it('copia la fecha: cambiar la original no cambia el pedido', () => {
      const placedAt = new Date(PLACED_AT);
      const order = Order.place(OrderId.generate(), items, placedAt);

      placedAt.setFullYear(2000);

      expect(order.toPrimitives().placedAt).toEqual(PLACED_AT);
    });
  });

  describe('total (RN-008)', () => {
    it('suma precio × cantidad de cada ítem', () => {
      // 3 × 350 + 2 × 520 = 1050 + 1040 = 2090
      const order = Order.place(OrderId.generate(), items, PLACED_AT);

      expect(order.total().cents).toBe(2090);
    });

    it('con un solo ítem es su subtotal', () => {
      const order = Order.place(OrderId.generate(), [items[0]], PLACED_AT);

      expect(order.total().cents).toBe(1050);
    });
  });

  describe('eventos de dominio', () => {
    it('place registra OrderPlaced con productos y cantidades', () => {
      const id = OrderId.generate();
      const order = Order.place(id, items, PLACED_AT);

      const events = order.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderPlaced);
      expect(events[0]).toEqual(
        new OrderPlaced(
          id.value,
          [
            { productId: INCA, quantity: 3 },
            { productId: ARROZ, quantity: 2 },
          ],
          PLACED_AT,
        ),
      );
    });

    it('pullDomainEvents vacía la lista: la segunda vez devuelve []', () => {
      const order = Order.place(OrderId.generate(), items, PLACED_AT);

      order.pullDomainEvents();

      expect(order.pullDomainEvents()).toEqual([]);
    });
  });

  describe('fromPrimitives / toPrimitives', () => {
    const stored: OrderPrimitives = {
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      placedAt: PLACED_AT,
      items: [
        {
          id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          productId: INCA,
          quantity: 3,
          unitPriceCents: 350,
        },
      ],
    };

    it('reconstruye el pedido con sus datos', () => {
      expect(Order.fromPrimitives(stored).toPrimitives()).toEqual(stored);
    });

    it('no emite eventos: el pedido ya se había registrado', () => {
      expect(Order.fromPrimitives(stored).pullDomainEvents()).toEqual([]);
    });

    it('toPrimitives devuelve una fecha copiada', () => {
      const order = Order.fromPrimitives(stored);

      order.toPrimitives().placedAt.setFullYear(2000);

      expect(order.toPrimitives().placedAt).toEqual(PLACED_AT);
    });
  });
});
