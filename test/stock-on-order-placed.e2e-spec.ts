import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { OrderPlaced } from '../src/orders/domain/events/order-placed.event';
import { DecreaseStockOnOrderPlaced } from '../src/products/infrastructure/listeners/decrease-stock-on-order-placed.listener';

/**
 * Un pedido registrado publica OrderPlaced y Products descuenta el
 * stock. El listener corre después de que responde el POST, así que cada test
 * espera a que termine antes de consultar GET /products.
 */
describe('Descuento de stock por OrderPlaced (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const pendingEvents: Promise<void>[] = [];

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

  afterEach(async () => {
    await waitForEvents();
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

  const placeOrder = (items: { productId: string; quantity: number }[]) =>
    request(app.getHttpServer()).post('/orders').send({ items });

  /** Espera a que el listener termine con todos los eventos publicados. */
  const waitForEvents = async () => {
    await Promise.all(pendingEvents.splice(0));
  };

  /** Stock actual de cada producto, leído por GET /products. */
  const stocks = async (): Promise<Record<string, number>> => {
    const res = await request(app.getHttpServer()).get('/products').expect(200);
    const list = res.body as { id: string; stock: number }[];
    return Object.fromEntries(list.map((p) => [p.id, p.stock]));
  };

  it('stock 10, se piden 3 → GET /products muestra 7', async () => {
    await placeOrder([{ productId: incaId, quantity: 3 }]).expect(201);
    await waitForEvents();

    expect(await stocks()).toEqual({ [incaId]: 7, [arrozId]: 5 });
  });

  it('descuenta cada producto del pedido, sumando líneas repetidas', async () => {
    await placeOrder([
      { productId: incaId, quantity: 2 },
      { productId: arrozId, quantity: 5 },
      { productId: incaId, quantity: 1 },
    ]).expect(201);
    await waitForEvents();

    expect(await stocks()).toEqual({ [incaId]: 7, [arrozId]: 0 });
  });

  it('pedidos seguidos van descontando y el siguiente ve el stock nuevo', async () => {
    await placeOrder([{ productId: arrozId, quantity: 3 }]).expect(201);
    await waitForEvents();

    // Quedan 2: pedir 3 ahora ya no alcanza (RN-006).
    const res = await placeOrder([{ productId: arrozId, quantity: 3 }]).expect(
      409,
    );
    expect(res.body).toMatchObject({ code: 'INSUFFICIENT_STOCK' });

    await placeOrder([{ productId: arrozId, quantity: 2 }]).expect(201);
    await waitForEvents();

    expect((await stocks())[arrozId]).toBe(0);
  });

  it('un pedido rechazado no toca el stock', async () => {
    await placeOrder([
      { productId: incaId, quantity: 1 },
      { productId: arrozId, quantity: 6 },
    ]).expect(409);
    await waitForEvents();

    expect(await stocks()).toEqual({ [incaId]: 10, [arrozId]: 5 });
  });
});
