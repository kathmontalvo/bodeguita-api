import { InvalidQuantityError } from './errors/invalid-quantity.error';
import { OrderItem, OrderItemPrimitives } from './order-item';

describe('OrderItem', () => {
  const PRODUCT_ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

  describe('create', () => {
    it('crea el ítem con un id generado', () => {
      const data = OrderItem.create({
        productId: PRODUCT_ID,
        quantity: 3,
        unitPriceCents: 350,
      }).toPrimitives();

      expect(data.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(data).toMatchObject({
        productId: PRODUCT_ID,
        quantity: 3,
        unitPriceCents: 350,
      });
    });

    it.each([0, -1, 1.5])('rechaza la cantidad %p (RN-005)', (quantity) => {
      expect(() =>
        OrderItem.create({
          productId: PRODUCT_ID,
          quantity,
          unitPriceCents: 350,
        }),
      ).toThrow(InvalidQuantityError);
    });
  });

  it('subtotal = precio unitario × cantidad (RN-008)', () => {
    const item = OrderItem.create({
      productId: PRODUCT_ID,
      quantity: 3,
      unitPriceCents: 350,
    });

    expect(item.subtotal().cents).toBe(1050);
  });

  it('fromPrimitives reconstruye el ítem conservando su id', () => {
    const stored: OrderItemPrimitives = {
      id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      productId: PRODUCT_ID,
      quantity: 2,
      unitPriceCents: 520,
    };

    expect(OrderItem.fromPrimitives(stored).toPrimitives()).toEqual(stored);
  });
});
