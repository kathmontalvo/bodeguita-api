import { InvalidProductIdError } from '../../domain/errors/invalid-product-id.error';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { Product } from '../../domain/product';
import { InMemoryProductRepository } from '../../infrastructure/persistence/in-memory-product.repository';
import { GetProductHandler } from './get-product.handler';
import { GetProductQuery } from './get-product.query';

describe('GetProductHandler', () => {
  const NO_EXISTE = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

  let repository: InMemoryProductRepository;
  let handler: GetProductHandler;

  beforeEach(() => {
    repository = new InMemoryProductRepository();
    handler = new GetProductHandler(repository);
  });

  it('devuelve el producto con el precio en soles', async () => {
    const inca = Product.create({
      sku: 'INCA-500',
      name: 'Inca Kola 500ml',
      priceCents: 350,
      stock: 24,
    });
    await repository.save(inca);
    const { id } = inca.toPrimitives();

    expect(await handler.execute(new GetProductQuery(id))).toEqual({
      id,
      sku: 'INCA-500',
      name: 'Inca Kola 500ml',
      price: 3.5,
      stock: 24,
    });
  });

  it('producto inexistente → PRODUCT_NOT_FOUND (404)', async () => {
    const error: unknown = await handler
      .execute(new GetProductQuery(NO_EXISTE))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProductNotFoundError);
    expect(error).toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
      kind: 'NOT_FOUND',
    });
  });

  it('id que no es UUID → INVALID_PRODUCT_ID (400)', async () => {
    await expect(handler.execute(new GetProductQuery('abc'))).rejects.toThrow(
      InvalidProductIdError,
    );
  });
});
