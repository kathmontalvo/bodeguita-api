import { Logger } from '@nestjs/common';
import { OrderPlaced } from '../../../orders/domain/events/order-placed.event';
import { Product } from '../../domain/product';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { InMemoryProductRepository } from '../persistence/in-memory-product.repository';
import { DecreaseStockOnOrderPlaced } from './decrease-stock-on-order-placed.listener';

describe('DecreaseStockOnOrderPlaced', () => {
  const ORDER_ID = 'b7a2a2e1-9b43-4d1c-aa6a-24da0e831c30';
  const NO_EXISTE = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

  let products: InMemoryProductRepository;
  let listener: DecreaseStockOnOrderPlaced;
  let incaId: string;
  let arrozId: string;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(async () => {
    products = new InMemoryProductRepository();
    listener = new DecreaseStockOnOrderPlaced(products);

    const inca = Product.create({
      sku: 'INCA-500',
      name: 'Inca Kola 500ml',
      priceCents: 350,
      stock: 10,
    });
    const arroz = Product.create({
      sku: 'ARROZ-1KG',
      name: 'Arroz 1kg',
      priceCents: 520,
      stock: 5,
    });
    await products.save(inca);
    await products.save(arroz);
    incaId = inca.toPrimitives().id;
    arrozId = arroz.toPrimitives().id;

    // Silencia el log en la salida de Jest y deja comprobar que se usó.
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const event = (items: { productId: string; quantity: number }[]) =>
    new OrderPlaced(ORDER_ID, items, new Date('2026-11-11T15:30:00.000Z'));

  const stockOf = async (id: string): Promise<number | undefined> =>
    (await products.findById(ProductId.create(id)))?.toPrimitives().stock;

  it('descuenta la cantidad pedida de cada producto', async () => {
    await listener.handle(
      event([
        { productId: incaId, quantity: 3 },
        { productId: arrozId, quantity: 2 },
      ]),
    );

    expect(await stockOf(incaId)).toBe(7);
    expect(await stockOf(arrozId)).toBe(3);
  });

  it('dos líneas del mismo producto se descuentan las dos', async () => {
    await listener.handle(
      event([
        { productId: incaId, quantity: 2 },
        { productId: incaId, quantity: 3 },
      ]),
    );

    expect(await stockOf(incaId)).toBe(5);
  });

  it('puede dejar el stock en 0', async () => {
    await listener.handle(event([{ productId: arrozId, quantity: 5 }]));

    expect(await stockOf(arrozId)).toBe(0);
  });

  it('si un producto ya no existe, lo registra y sigue con los demás', async () => {
    await expect(
      listener.handle(
        event([
          { productId: NO_EXISTE, quantity: 1 },
          { productId: incaId, quantity: 1 },
        ]),
      ),
    ).resolves.toBeUndefined();

    expect(await stockOf(incaId)).toBe(9);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('RN-003: si no alcanza (sobreventa), no deja stock negativo, lo registra y sigue', async () => {
    await expect(
      listener.handle(
        event([
          { productId: arrozId, quantity: 6 },
          { productId: incaId, quantity: 1 },
        ]),
      ),
    ).resolves.toBeUndefined();

    expect(await stockOf(arrozId)).toBe(5);
    expect(await stockOf(incaId)).toBe(9);
    expect(error).toHaveBeenCalledTimes(1);
  });
});
