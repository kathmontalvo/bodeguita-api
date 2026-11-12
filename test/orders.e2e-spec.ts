import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { OrderPlaced } from '../src/orders/domain/events/order-placed.event';
import { DecreaseStockOnOrderPlaced } from '../src/products/infrastructure/listeners/decrease-stock-on-order-placed.listener';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NO_EXISTE = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

interface OrderBody {
  id: string;
  placedAt: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  total: number;
}

describe('Orders (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const pendingEvents: Promise<void>[] = [];

  // Productos creados en cada test por POST /products.
  let incaId: string;
  let arrozId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    dataSource = app.get(DataSource);

    // El listener de OrderPlaced corre DESPUÉS de que responde el POST. Se
    // guardan sus promesas para esperarlas al final de cada test; si no, su
    // save() podría ejecutarse después del TRUNCATE del test siguiente.
    const listener = app.get(DecreaseStockOnOrderPlaced);
    // Se guarda el método ORIGINAL antes de espiarlo; si no, el spy se
    // llamaría a sí mismo.
    const handle = listener.handle.bind(listener) as (
      event: OrderPlaced,
    ) => Promise<void>;
    jest.spyOn(listener, 'handle').mockImplementation((event) => {
      const done = handle(event);
      pendingEvents.push(done);
      return done;
    });
  });

  afterEach(async () => {
    await Promise.all(pendingEvents.splice(0));
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE order_items, orders, products');
    incaId = await createProduct({
      sku: 'INCA-500',
      name: 'Inca Kola 500ml',
      price: 3.5,
      stock: 10,
    });
    arrozId = await createProduct({
      sku: 'ARROZ-1KG',
      name: 'Arroz Costeño 1kg',
      price: 5.2,
      stock: 5,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  async function createProduct(body: object): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/products')
      .send(body)
      .expect(201);
    return (res.body as { id: string }).id;
  }

  const placeOrder = (body: object) =>
    request(app.getHttpServer()).post('/orders').send(body);

  const getOrder = (id: string) =>
    request(app.getHttpServer()).get(`/orders/${id}`);

  const countOrders = async (): Promise<number> => {
    const rows: { count: number }[] = await dataSource.query(
      'SELECT count(*)::int AS count FROM orders',
    );
    return rows[0].count;
  };

  describe('POST /orders', () => {
    it('201: registra el pedido y devuelve solo su id', async () => {
      const res = await placeOrder({
        items: [{ productId: incaId, quantity: 3 }],
      }).expect(201);

      const body = res.body as { id: string };
      expect(Object.keys(body)).toEqual(['id']);
      expect(body.id).toMatch(UUID);
    });

    it('guarda el pedido y sus ítems con el precio en céntimos (RN-008)', async () => {
      const res = await placeOrder({
        items: [
          { productId: incaId, quantity: 3 },
          { productId: arrozId, quantity: 2 },
        ],
      }).expect(201);
      const { id } = res.body as { id: string };

      const rows: unknown[] = await dataSource.query(
        `SELECT product_id, quantity, unit_price_cents
           FROM order_items WHERE order_id = $1 ORDER BY unit_price_cents`,
        [id],
      );
      expect(rows).toEqual([
        { product_id: incaId, quantity: 3, unit_price_cents: 350 },
        { product_id: arrozId, quantity: 2, unit_price_cents: 520 },
      ]);
    });

    it('201: RN-006 acepta pedir exactamente el stock disponible', async () => {
      await placeOrder({
        items: [{ productId: arrozId, quantity: 5 }],
      }).expect(201);
    });

    it('400: RN-004 pedido sin ítems y no guarda nada', async () => {
      const res = await placeOrder({ items: [] }).expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        code: 'ORDER_WITHOUT_ITEMS',
      });
      expect(await countOrders()).toBe(0);
    });

    it('400: RN-005 cantidad 0', async () => {
      const res = await placeOrder({
        items: [{ productId: incaId, quantity: 0 }],
      }).expect(400);

      expect(res.body).toMatchObject({ code: 'INVALID_QUANTITY' });
      expect(await countOrders()).toBe(0);
    });

    it('404: RN-007 producto inexistente y no guarda nada', async () => {
      const res = await placeOrder({
        items: [
          { productId: incaId, quantity: 1 },
          { productId: NO_EXISTE, quantity: 1 },
        ],
      }).expect(404);

      expect(res.body).toMatchObject({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
      });
      expect(await countOrders()).toBe(0);
    });

    it('409: RN-006 más que el stock disponible y no guarda nada', async () => {
      const res = await placeOrder({
        items: [{ productId: arrozId, quantity: 6 }],
      }).expect(409);

      expect(res.body).toMatchObject({
        statusCode: 409,
        code: 'INSUFFICIENT_STOCK',
      });
      expect(await countOrders()).toBe(0);
    });

    it('400: el DTO rechaza body sin items, ids que no son UUID y campos de más', async () => {
      await placeOrder({}).expect(400);
      await placeOrder({
        items: [{ productId: 'abc', quantity: 1 }],
      }).expect(400);
      await placeOrder({
        items: [{ productId: incaId, quantity: 1.5 }],
      }).expect(400);
      // El cliente no puede mandar el precio (RN-008).
      await placeOrder({
        items: [{ productId: incaId, quantity: 1, unitPrice: 0.1 }],
      }).expect(400);

      expect(await countOrders()).toBe(0);
    });
  });

  describe('GET /orders/:id', () => {
    it('200: devuelve el pedido con montos en soles, subtotales y total', async () => {
      const created = await placeOrder({
        items: [
          { productId: incaId, quantity: 3 },
          { productId: arrozId, quantity: 2 },
        ],
      }).expect(201);
      const { id } = created.body as { id: string };

      const res = await getOrder(id).expect(200);
      const body = res.body as OrderBody;

      expect(body.id).toBe(id);
      expect(new Date(body.placedAt).toISOString()).toBe(body.placedAt);
      // La tabla no guarda posición: se comparan sin depender del orden.
      expect(body.items).toHaveLength(2);
      expect(body.items).toEqual(
        expect.arrayContaining([
          { productId: incaId, quantity: 3, unitPrice: 3.5, subtotal: 10.5 },
          { productId: arrozId, quantity: 2, unitPrice: 5.2, subtotal: 10.4 },
        ]),
      );
      expect(body.total).toBe(20.9);
    });

    it('RN-008: si luego cambia el precio del producto, el pedido no cambia', async () => {
      const created = await placeOrder({
        items: [{ productId: incaId, quantity: 2 }],
      }).expect(201);
      const { id } = created.body as { id: string };

      // No hay endpoint para cambiar precios: se simula directo en la BD.
      await dataSource.query(
        'UPDATE products SET price_cents = 999 WHERE id = $1',
        [incaId],
      );

      const res = await getOrder(id).expect(200);
      expect(res.body).toMatchObject({
        items: [{ unitPrice: 3.5, subtotal: 7 }],
        total: 7,
      });
    });

    it('404: pedido inexistente', async () => {
      const res = await getOrder(NO_EXISTE).expect(404);

      expect(res.body).toMatchObject({
        statusCode: 404,
        code: 'ORDER_NOT_FOUND',
      });
    });

    it('400: id que no es UUID', async () => {
      const res = await getOrder('abc').expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        code: 'INVALID_ORDER_ID',
      });
    });
  });
});
