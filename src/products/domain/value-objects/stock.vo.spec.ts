import { captureError } from '../../../shared/testing/capture-error';
import { InsufficientStockError } from '../errors/insufficient-stock.error';
import { InvalidStockError } from '../errors/invalid-stock.error';
import { Stock } from './stock.vo';

describe('Stock', () => {
  describe('create', () => {
    it('acepta enteros mayores o iguales a 0', () => {
      expect(Stock.create(0).value).toBe(0);
      expect(Stock.create(24).value).toBe(24);
    });

    it.each([-1, 2.5, NaN])('rechaza %p (RN-003)', (value) => {
      expect(() => Stock.create(value)).toThrow(InvalidStockError);
    });

    it('el error tiene code INVALID_STOCK y kind VALIDATION', () => {
      expect(captureError(() => Stock.create(-1))).toMatchObject({
        code: 'INVALID_STOCK',
        kind: 'VALIDATION',
      });
    });
  });

  describe('decrease', () => {
    it('devuelve un stock nuevo con la resta', () => {
      expect(Stock.create(5).decrease(2).value).toBe(3);
    });

    it('puede dejar el stock en 0', () => {
      expect(Stock.create(5).decrease(5).value).toBe(0);
    });

    it('no modifica el stock original (inmutable)', () => {
      const original = Stock.create(5);
      original.decrease(2);
      expect(original.value).toBe(5);
    });

    it('lanza INSUFFICIENT_STOCK (409) si se pide más de lo que hay', () => {
      const error = captureError(() => Stock.create(5).decrease(6));
      expect(error).toBeInstanceOf(InsufficientStockError);
      expect(error).toMatchObject({
        code: 'INSUFFICIENT_STOCK',
        kind: 'CONFLICT',
      });
    });

    it.each([0, -1, 1.5])('rechaza la cantidad %p', (quantity) => {
      expect(() => Stock.create(5).decrease(quantity)).toThrow(
        InvalidStockError,
      );
    });
  });

  it('equals compara por valor', () => {
    expect(Stock.create(3).equals(Stock.create(3))).toBe(true);
    expect(Stock.create(3).equals(Stock.create(4))).toBe(false);
  });
});
