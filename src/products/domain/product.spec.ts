import { InsufficientStockError } from './errors/insufficient-stock.error';
import { InvalidPriceError } from './errors/invalid-price.error';
import { InvalidProductNameError } from './errors/invalid-product-name.error';
import { InvalidSkuError } from './errors/invalid-sku.error';
import { InvalidStockError } from './errors/invalid-stock.error';
import { CreateProductProps, Product, ProductPrimitives } from './product';

describe('Product', () => {
  const props: CreateProductProps = {
    sku: 'inca-500',
    name: 'Inca Kola 500ml',
    priceCents: 350,
    stock: 5,
  };

  describe('create', () => {
    it('crea el producto con un id generado y los datos normalizados', () => {
      const data = Product.create(props).toPrimitives();

      expect(data.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(data).toMatchObject({
        sku: 'INCA-500',
        name: 'Inca Kola 500ml',
        priceCents: 350,
        stock: 5,
      });
    });

    it('genera un id distinto para cada producto', () => {
      expect(Product.create(props).toPrimitives().id).not.toBe(
        Product.create(props).toPrimitives().id,
      );
    });

    it.each<
      [string, Partial<CreateProductProps>, new (...a: never[]) => Error]
    >([
      ['SKU inválido', { sku: '' }, InvalidSkuError],
      ['nombre vacío', { name: '  ' }, InvalidProductNameError],
      ['precio 0 (RN-002)', { priceCents: 0 }, InvalidPriceError],
      ['stock negativo (RN-003)', { stock: -1 }, InvalidStockError],
    ])('no se crea con %s', (_, override, error) => {
      expect(() => Product.create({ ...props, ...override })).toThrow(error);
    });
  });

  describe('decreaseStock', () => {
    it('resta la cantidad del stock', () => {
      const product = Product.create(props);
      product.decreaseStock(2);
      expect(product.toPrimitives().stock).toBe(3);
    });

    it('lanza INSUFFICIENT_STOCK y no cambia el stock si no alcanza', () => {
      const product = Product.create(props);
      expect(() => product.decreaseStock(6)).toThrow(InsufficientStockError);
      expect(product.toPrimitives().stock).toBe(5);
    });
  });

  describe('fromPrimitives / toPrimitives', () => {
    const stored: ProductPrimitives = {
      id: '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c',
      sku: 'ARROZ-1KG',
      name: 'Arroz Costeño 1kg',
      priceCents: 520,
      stock: 0,
    };

    it('reconstruye el producto conservando su id', () => {
      expect(Product.fromPrimitives(stored).toPrimitives()).toEqual(stored);
    });

    it('toPrimitives devuelve una copia: cambiarla no afecta al producto', () => {
      const product = Product.fromPrimitives(stored);
      product.toPrimitives().stock = 99;
      expect(product.toPrimitives().stock).toBe(0);
    });
  });
});
