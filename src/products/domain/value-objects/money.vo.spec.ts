import { captureError } from '../../../shared/testing/capture-error';
import { InvalidPriceError } from '../errors/invalid-price.error';
import { Money } from './money.vo';

describe('Money', () => {
  it('acepta céntimos enteros mayores que 0', () => {
    expect(Money.create(350).cents).toBe(350);
    expect(Money.create(1).cents).toBe(1);
  });

  it.each([0, -100, 3.5, NaN, Infinity])('rechaza %p (RN-002)', (cents) => {
    expect(() => Money.create(cents)).toThrow(InvalidPriceError);
  });

  it('el error tiene code INVALID_PRICE y kind VALIDATION', () => {
    expect(captureError(() => Money.create(0))).toMatchObject({
      code: 'INVALID_PRICE',
      kind: 'VALIDATION',
    });
  });

  it('equals compara por valor', () => {
    expect(Money.create(350).equals(Money.create(350))).toBe(true);
    expect(Money.create(350).equals(Money.create(351))).toBe(false);
  });
});
