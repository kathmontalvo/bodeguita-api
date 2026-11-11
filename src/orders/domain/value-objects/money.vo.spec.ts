import { captureError } from '../../../shared/testing/capture-error';
import { InvalidMoneyError } from '../errors/invalid-money.error';
import { Money } from './money.vo';
import { Quantity } from './quantity.vo';

describe('Money (Pedidos)', () => {
  describe('create', () => {
    it('acepta céntimos enteros mayores o iguales a 0', () => {
      expect(Money.create(0).cents).toBe(0);
      expect(Money.create(350).cents).toBe(350);
    });

    it.each([-1, 3.5, NaN, Infinity])('rechaza %p', (cents) => {
      expect(() => Money.create(cents)).toThrow(InvalidMoneyError);
    });

    it('el error tiene code INVALID_MONEY y kind VALIDATION', () => {
      expect(captureError(() => Money.create(-1))).toMatchObject({
        code: 'INVALID_MONEY',
        kind: 'VALIDATION',
      });
    });
  });

  it('zero vale 0', () => {
    expect(Money.zero().cents).toBe(0);
  });

  it('add suma dos montos', () => {
    expect(Money.create(350).add(Money.create(520)).cents).toBe(870);
  });

  it('multiply multiplica por una cantidad (RN-008)', () => {
    expect(Money.create(350).multiply(Quantity.create(3)).cents).toBe(1050);
  });

  it('add y multiply no modifican el original (inmutable)', () => {
    const price = Money.create(350);
    price.add(Money.create(100));
    price.multiply(Quantity.create(2));
    expect(price.cents).toBe(350);
  });

  it('equals compara por valor', () => {
    expect(Money.create(350).equals(Money.create(350))).toBe(true);
    expect(Money.create(350).equals(Money.create(351))).toBe(false);
  });
});
