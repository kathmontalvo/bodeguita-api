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

  describe('rename', () => {
    it('cambia el nombre (sin espacios al inicio ni al final)', () => {
      const product = Product.create(props);
      product.rename('  Inca Kola 1L ');
      expect(product.toPrimitives().name).toBe('Inca Kola 1L');
    });

    it('rechaza un nombre vacío y conserva el anterior', () => {
      const product = Product.create(props);
      expect(() => product.rename('  ')).toThrow(InvalidProductNameError);
      expect(product.toPrimitives().name).toBe('Inca Kola 500ml');
    });
  });

  describe('changePrice', () => {
    it('cambia el precio', () => {
      const product = Product.create(props);
      product.changePrice(420);
      expect(product.toPrimitives().priceCents).toBe(420);
    });

    it.each([0, -100, 3.5])(
      'RN-002: rechaza %p y conserva el precio anterior',
      (cents) => {
        const product = Product.create(props);
        expect(() => product.changePrice(cents)).toThrow(InvalidPriceError);
        expect(product.toPrimitives().priceCents).toBe(350);
      },
    );
  });

  describe('changeStock', () => {
    it('fija el stock al valor nuevo (no lo suma)', () => {
      const product = Product.create(props);
      product.changeStock(50);
      expect(product.toPrimitives().stock).toBe(50);
    });

    it('acepta dejarlo en 0', () => {
      const product = Product.create(props);
      product.changeStock(0);
      expect(product.toPrimitives().stock).toBe(0);
    });

    it.each([-1, 2.5])(
      'RN-003: rechaza %p y conserva el stock anterior',
      (stock) => {
        const product = Product.create(props);
        expect(() => product.changeStock(stock)).toThrow(InvalidStockError);
        expect(product.toPrimitives().stock).toBe(5);
      },
    );
  });

  it('el SKU y el id no cambian al actualizar', () => {
    const product = Product.create(props);
    const before = product.toPrimitives();

    product.rename('Otro nombre');
    product.changePrice(999);
    product.changeStock(1);

    expect(product.toPrimitives()).toMatchObject({
      id: before.id,
      sku: before.sku,
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
