import { Product } from '../../domain/product';
import { InMemoryProductRepository } from '../../infrastructure/persistence/in-memory-product.repository';
import { ListProductsHandler } from './list-products.handler';

describe('ListProductsHandler', () => {
  let repository: InMemoryProductRepository;
  let handler: ListProductsHandler;

  beforeEach(() => {
    repository = new InMemoryProductRepository();
    handler = new ListProductsHandler(repository);
  });

  it('devuelve una lista vacía si no hay productos', async () => {
    expect(await handler.execute()).toEqual([]);
  });

  it('devuelve todos los productos con el precio en soles', async () => {
    const inca = Product.create({
      sku: 'INCA-500',
      name: 'Inca Kola 500ml',
      priceCents: 350,
      stock: 24,
    });
    const arroz = Product.create({
      sku: 'ARROZ-1KG',
      name: 'Arroz Costeño 1kg',
      priceCents: 520,
      stock: 0,
    });
    await repository.save(inca);
    await repository.save(arroz);

    const result = await handler.execute();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        {
          id: inca.toPrimitives().id,
          sku: 'INCA-500',
          name: 'Inca Kola 500ml',
          price: 3.5,
          stock: 24,
        },
        {
          id: arroz.toPrimitives().id,
          sku: 'ARROZ-1KG',
          name: 'Arroz Costeño 1kg',
          price: 5.2,
          stock: 0,
        },
      ]),
    );
  });
});
