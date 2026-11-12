import { InvalidPriceError } from '../../domain/errors/invalid-price.error';
import { InvalidProductIdError } from '../../domain/errors/invalid-product-id.error';
import { InvalidStockError } from '../../domain/errors/invalid-stock.error';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { Product, ProductPrimitives } from '../../domain/product';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { InMemoryProductRepository } from '../../infrastructure/persistence/in-memory-product.repository';
import { ProductChanges, UpdateProductCommand } from './update-product.command';
import { UpdateProductHandler } from './update-product.handler';

describe('UpdateProductHandler', () => {
  const NO_EXISTE = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

  let repository: InMemoryProductRepository;
  let handler: UpdateProductHandler;
  let original: ProductPrimitives;

  beforeEach(async () => {
    repository = new InMemoryProductRepository();
    handler = new UpdateProductHandler(repository);

    const inca = Product.create({
      sku: 'INCA-500',
      name: 'Inca Kola 500ml',
      priceCents: 350,
      stock: 24,
    });
    await repository.save(inca);
    original = inca.toPrimitives();
  });

  const update = (changes: ProductChanges, id = original.id) =>
    handler.execute(new UpdateProductCommand(id, changes));

  const stored = async (): Promise<ProductPrimitives | undefined> =>
    (await repository.findById(ProductId.create(original.id)))?.toPrimitives();

  describe('actualización válida', () => {
    it('cambia solo los campos enviados y devuelve el producto en soles', async () => {
      const response = await update({ price: 4.2 });

      expect(response).toEqual({
        id: original.id,
        sku: 'INCA-500',
        name: 'Inca Kola 500ml',
        price: 4.2,
        stock: 24,
      });
      expect(await stored()).toEqual({ ...original, priceCents: 420 });
    });

    it('puede cambiar nombre, precio y stock a la vez', async () => {
      await update({ name: 'Inca Kola 1L', price: 6.9, stock: 50 });

      expect(await stored()).toEqual({
        ...original,
        name: 'Inca Kola 1L',
        priceCents: 690,
        stock: 50,
      });
    });

    it('convierte el precio de soles a céntimos sin errores de decimales', async () => {
      await update({ price: 1.15 });

      expect((await stored())?.priceCents).toBe(115);
    });

    it('sin cambios no modifica nada', async () => {
      await expect(update({})).resolves.toMatchObject({
        price: 3.5,
        stock: 24,
      });
      expect(await stored()).toEqual(original);
    });
  });

  describe('errores: no se guarda nada', () => {
    it('RN-002: precio 0', async () => {
      await expect(update({ price: 0 })).rejects.toThrow(InvalidPriceError);
      expect(await stored()).toEqual(original);
    });

    it('RN-003: stock negativo, aunque el nombre sí fuera válido', async () => {
      await expect(update({ name: 'Nombre nuevo', stock: -1 })).rejects.toThrow(
        InvalidStockError,
      );
      expect(await stored()).toEqual(original);
    });

    it('producto inexistente → PRODUCT_NOT_FOUND (404)', async () => {
      await expect(update({ price: 1 }, NO_EXISTE)).rejects.toThrow(
        ProductNotFoundError,
      );
    });

    it('id que no es UUID → INVALID_PRODUCT_ID (400)', async () => {
      await expect(update({ price: 1 }, 'abc')).rejects.toThrow(
        InvalidProductIdError,
      );
    });
  });
});
