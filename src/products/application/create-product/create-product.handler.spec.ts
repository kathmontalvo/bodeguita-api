import { InvalidPriceError } from '../../domain/errors/invalid-price.error';
import { InvalidProductNameError } from '../../domain/errors/invalid-product-name.error';
import { ProductSkuAlreadyExistsError } from '../../domain/errors/product-sku-already-exists.error';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { InMemoryProductRepository } from '../../infrastructure/persistence/in-memory-product.repository';
import { CreateProductCommand } from './create-product.command';
import { CreateProductHandler } from './create-product.handler';

describe('CreateProductHandler', () => {
  let repository: InMemoryProductRepository;
  let handler: CreateProductHandler;

  beforeEach(() => {
    repository = new InMemoryProductRepository();
    handler = new CreateProductHandler(repository);
  });

  const command = (overrides: Partial<CreateProductCommand> = {}) =>
    new CreateProductCommand(
      overrides.sku ?? 'inca-500',
      overrides.name ?? 'Inca Kola 500ml',
      overrides.price ?? 3.5,
      overrides.stock ?? 24,
    );

  it('crea el producto, lo guarda y devuelve su id', async () => {
    const { id } = await handler.execute(command());

    const saved = await repository.findById(ProductId.create(id));
    expect(saved?.toPrimitives()).toEqual({
      id,
      sku: 'INCA-500',
      name: 'Inca Kola 500ml',
      priceCents: 350,
      stock: 24,
    });
  });

  it('convierte el precio de soles a céntimos sin errores de decimales', async () => {
    const { id } = await handler.execute(command({ price: 1.15 }));

    const saved = await repository.findById(ProductId.create(id));
    expect(saved?.toPrimitives().priceCents).toBe(115);
  });

  it('RN-001: rechaza un SKU repetido con PRODUCT_SKU_ALREADY_EXISTS (409)', async () => {
    await handler.execute(command({ sku: 'INCA-500' }));

    const error = await handler
      .execute(command({ sku: ' inca-500 ', name: 'Otro nombre' }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProductSkuAlreadyExistsError);
    expect(error).toMatchObject({
      code: 'PRODUCT_SKU_ALREADY_EXISTS',
      kind: 'CONFLICT',
    });
    expect(await repository.findAll()).toHaveLength(1);
  });

  it('RN-002: rechaza precio 0 y no guarda nada', async () => {
    await expect(handler.execute(command({ price: 0 }))).rejects.toThrow(
      InvalidPriceError,
    );
    expect(await repository.findAll()).toHaveLength(0);
  });

  it('valida los datos antes que el SKU: dato inválido + SKU repetido da 400, no 409', async () => {
    await handler.execute(command());

    const error = await handler
      .execute(command({ name: '' }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(InvalidProductNameError);
    expect(error).toMatchObject({
      code: 'INVALID_PRODUCT_NAME',
      kind: 'VALIDATION',
    });
  });
});
