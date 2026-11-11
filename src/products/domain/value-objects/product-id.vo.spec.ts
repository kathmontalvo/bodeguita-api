import { captureError } from '../../../shared/testing/capture-error';
import { InvalidProductIdError } from '../errors/invalid-product-id.error';
import { ProductId } from './product-id.vo';

describe('ProductId', () => {
  const VALID_UUID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

  it('generate crea un UUID válido', () => {
    const id = ProductId.generate();
    expect(ProductId.create(id.value).equals(id)).toBe(true);
  });

  it('generate crea ids distintos cada vez', () => {
    expect(ProductId.generate().equals(ProductId.generate())).toBe(false);
  });

  it('create acepta un UUID y lo pasa a minúsculas', () => {
    expect(ProductId.create(VALID_UUID.toUpperCase()).value).toBe(VALID_UUID);
  });

  it.each(['', '   ', 'abc', '1234', '3f2b8c1e-9a4d-4e7b-8c2a'])(
    'rechaza "%s"',
    (raw) => {
      expect(() => ProductId.create(raw)).toThrow(InvalidProductIdError);
    },
  );

  it('el error tiene code INVALID_PRODUCT_ID y kind VALIDATION', () => {
    expect(captureError(() => ProductId.create('abc'))).toMatchObject({
      code: 'INVALID_PRODUCT_ID',
      kind: 'VALIDATION',
    });
  });

  it('equals compara por valor', () => {
    const id = ProductId.create(VALID_UUID);
    expect(id.equals(ProductId.create(VALID_UUID))).toBe(true);
    expect(id.equals(ProductId.generate())).toBe(false);
  });
});
