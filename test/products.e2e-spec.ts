import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('Products (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const inca = {
    sku: 'inca-500',
    name: 'Inca Kola 500ml',
    price: 3.5,
    stock: 24,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    dataSource = app.get(DataSource);
  });

  // Cada test empieza con la tabla vacía: no dependen del orden.
  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE products');
  });

  afterAll(async () => {
    await app.close();
  });

  const createProduct = (body: object) =>
    request(app.getHttpServer()).post('/products').send(body);

  describe('POST /products', () => {
    it('201: crea el producto y devuelve su id', async () => {
      const res = await createProduct(inca).expect(201);

      const body = res.body as { id: string };
      expect(Object.keys(body)).toEqual(['id']);
      expect(body.id).toMatch(UUID);
    });

    it('guarda el precio en céntimos y el SKU en mayúsculas', async () => {
      await createProduct(inca).expect(201);

      const rows: unknown[] = await dataSource.query(
        'SELECT sku, price_cents FROM products',
      );
      expect(rows).toEqual([{ sku: 'INCA-500', price_cents: 350 }]);
    });

    it('409: RN-001 SKU duplicado, aunque cambien mayúsculas o espacios', async () => {
      await createProduct(inca).expect(201);

      const res = await createProduct({
        ...inca,
        sku: ' INCA-500 ',
        name: 'Otro',
      }).expect(409);

      expect(res.body).toMatchObject({
        statusCode: 409,
        code: 'PRODUCT_SKU_ALREADY_EXISTS',
      });
    });

    it('400: RN-002 precio 0 y no guarda nada', async () => {
      const res = await createProduct({ ...inca, price: 0 }).expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        code: 'INVALID_PRICE',
      });
      await request(app.getHttpServer()).get('/products').expect(200, []);
    });

    it('400: RN-003 stock negativo', async () => {
      const res = await createProduct({ ...inca, stock: -1 }).expect(400);

      expect(res.body).toMatchObject({ code: 'INVALID_STOCK' });
    });

    it('400: SKU con caracteres no permitidos', async () => {
      const res = await createProduct({ ...inca, sku: 'INCA 500' }).expect(400);

      expect(res.body).toMatchObject({ code: 'INVALID_SKU' });
    });

    it('400: el DTO rechaza tipos incorrectos y campos de más', async () => {
      await createProduct({ ...inca, price: 'tres' }).expect(400);
      await createProduct({ ...inca, price: 3.555 }).expect(400);
      await createProduct({ ...inca, extra: true }).expect(400);
    });
  });

  describe('GET /products', () => {
    it('200: lista vacía si no hay productos', async () => {
      await request(app.getHttpServer()).get('/products').expect(200, []);
    });

    it('200: devuelve los productos con el precio en soles', async () => {
      const created = await createProduct(inca).expect(201);
      const { id } = created.body as { id: string };

      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(res.body).toEqual([
        {
          id,
          sku: 'INCA-500',
          name: 'Inca Kola 500ml',
          price: 3.5,
          stock: 24,
        },
      ]);
    });
  });

  describe('GET /products/:id', () => {
    it('200: devuelve el producto con el precio en soles', async () => {
      const created = await createProduct(inca).expect(201);
      const { id } = created.body as { id: string };

      await request(app.getHttpServer()).get(`/products/${id}`).expect(200, {
        id,
        sku: 'INCA-500',
        name: 'Inca Kola 500ml',
        price: 3.5,
        stock: 24,
      });
    });

    it('404: producto inexistente', async () => {
      const res = await request(app.getHttpServer())
        .get('/products/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .expect(404);

      expect(res.body).toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    });

    it('400: id que no es UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/products/abc')
        .expect(400);

      expect(res.body).toMatchObject({ code: 'INVALID_PRODUCT_ID' });
    });
  });

  describe('PATCH /products/:id', () => {
    let id: string;

    beforeEach(async () => {
      const created = await createProduct(inca).expect(201);
      id = (created.body as { id: string }).id;
    });

    const updateProduct = (body: object, productId = id) =>
      request(app.getHttpServer()).patch(`/products/${productId}`).send(body);

    const getProduct = () =>
      request(app.getHttpServer()).get(`/products/${id}`).expect(200);

    it('200: cambia solo lo enviado y devuelve el producto actualizado', async () => {
      const res = await updateProduct({ price: 4.2 }).expect(200);

      expect(res.body).toEqual({
        id,
        sku: 'INCA-500',
        name: 'Inca Kola 500ml',
        price: 4.2,
        stock: 24,
      });
      expect((await getProduct()).body).toEqual(res.body);
    });

    it('200: cambia nombre, precio y stock a la vez, y guarda céntimos', async () => {
      await updateProduct({
        name: 'Inca Kola 1L',
        price: 6.9,
        stock: 50,
      }).expect(200);

      const rows: unknown[] = await dataSource.query(
        'SELECT name, price_cents, stock FROM products WHERE id = $1',
        [id],
      );
      expect(rows).toEqual([
        { name: 'Inca Kola 1L', price_cents: 690, stock: 50 },
      ]);
    });

    it('200: body vacío no cambia nada', async () => {
      await updateProduct({}).expect(200);

      expect((await getProduct()).body).toMatchObject({
        price: 3.5,
        stock: 24,
      });
    });

    it.each([
      ['precio 0 (RN-002)', { price: 0 }, 'INVALID_PRICE'],
      ['stock negativo (RN-003)', { stock: -1 }, 'INVALID_STOCK'],
      ['nombre vacío', { name: '  ' }, 'INVALID_PRODUCT_NAME'],
    ])('400: %s y no guarda nada', async (_, body, code) => {
      const res = await updateProduct(body).expect(400);

      expect(res.body).toMatchObject({ statusCode: 400, code });
      expect((await getProduct()).body).toMatchObject({
        name: 'Inca Kola 500ml',
        price: 3.5,
        stock: 24,
      });
    });

    it('400: el SKU no se puede cambiar', async () => {
      await updateProduct({ sku: 'OTRO-SKU' }).expect(400);

      expect((await getProduct()).body).toMatchObject({ sku: 'INCA-500' });
    });

    it('400: el DTO rechaza tipos incorrectos y precio con 3 decimales', async () => {
      await updateProduct({ price: 'tres' }).expect(400);
      await updateProduct({ price: 3.555 }).expect(400);
      await updateProduct({ stock: 1.5 }).expect(400);
    });

    it('404: producto inexistente', async () => {
      const res = await updateProduct(
        { price: 1 },
        '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      ).expect(404);

      expect(res.body).toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    });

    it('400: id que no es UUID', async () => {
      const res = await updateProduct({ price: 1 }, 'abc').expect(400);

      expect(res.body).toMatchObject({ code: 'INVALID_PRODUCT_ID' });
    });
  });
});
