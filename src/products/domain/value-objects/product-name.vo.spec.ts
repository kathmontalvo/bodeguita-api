import { captureError } from '../../../shared/testing/capture-error';
import { InvalidProductNameError } from '../errors/invalid-product-name.error';
import { ProductName } from './product-name.vo';

describe('ProductName', () => {
  it('acepta un nombre y le quita los espacios de los extremos', () => {
    expect(ProductName.create('  Inca Kola 500ml ').value).toBe(
      'Inca Kola 500ml',
    );
  });

  it('no cambia mayúsculas ni minúsculas', () => {
    expect(ProductName.create('Galletas Soda').value).toBe('Galletas Soda');
  });

  it('acepta exactamente 100 caracteres', () => {
    expect(ProductName.create('a'.repeat(100)).value).toHaveLength(100);
  });

  it.each(['', '   ', 'a'.repeat(101)])('rechaza "%s"', (raw) => {
    expect(() => ProductName.create(raw)).toThrow(InvalidProductNameError);
  });

  it('el error tiene code INVALID_PRODUCT_NAME y kind VALIDATION', () => {
    expect(captureError(() => ProductName.create(''))).toMatchObject({
      code: 'INVALID_PRODUCT_NAME',
      kind: 'VALIDATION',
    });
  });

  it('equals compara por valor', () => {
    const name = ProductName.create('Arroz');
    expect(name.equals(ProductName.create(' Arroz '))).toBe(true);
    expect(name.equals(ProductName.create('Azúcar'))).toBe(false);
  });
});
