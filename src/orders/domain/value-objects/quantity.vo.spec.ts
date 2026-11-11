import { captureError } from '../../../shared/testing/capture-error';
import { InvalidQuantityError } from '../errors/invalid-quantity.error';
import { Quantity } from './quantity.vo';

describe('Quantity', () => {
  it('acepta enteros mayores que 0', () => {
    expect(Quantity.create(1).value).toBe(1);
    expect(Quantity.create(12).value).toBe(12);
  });

  it.each([0, -1, 1.5, NaN, Infinity])('rechaza %p (RN-005)', (value) => {
    expect(() => Quantity.create(value)).toThrow(InvalidQuantityError);
  });

  it('el error tiene code INVALID_QUANTITY y kind VALIDATION', () => {
    expect(captureError(() => Quantity.create(0))).toMatchObject({
      code: 'INVALID_QUANTITY',
      kind: 'VALIDATION',
    });
  });

  it('equals compara por valor', () => {
    expect(Quantity.create(3).equals(Quantity.create(3))).toBe(true);
    expect(Quantity.create(3).equals(Quantity.create(4))).toBe(false);
  });
});
