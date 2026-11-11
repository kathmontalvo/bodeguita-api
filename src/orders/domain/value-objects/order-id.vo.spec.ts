import { captureError } from '../../../shared/testing/capture-error';
import { InvalidOrderIdError } from '../errors/invalid-order-id.error';
import { OrderId } from './order-id.vo';

describe('OrderId', () => {
  const VALID_UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

  it('generate crea un UUID válido', () => {
    const id = OrderId.generate();
    expect(OrderId.create(id.value).equals(id)).toBe(true);
  });

  it('generate crea ids distintos cada vez', () => {
    expect(OrderId.generate().equals(OrderId.generate())).toBe(false);
  });

  it('create acepta un UUID y lo pasa a minúsculas', () => {
    expect(OrderId.create(VALID_UUID.toUpperCase()).value).toBe(VALID_UUID);
  });

  it.each(['', '   ', 'abc', '123', '7c9e6679-7425-40de-944b'])(
    'rechaza "%s"',
    (raw) => {
      expect(() => OrderId.create(raw)).toThrow(InvalidOrderIdError);
    },
  );

  it('el error tiene code INVALID_ORDER_ID y kind VALIDATION', () => {
    expect(captureError(() => OrderId.create('abc'))).toMatchObject({
      code: 'INVALID_ORDER_ID',
      kind: 'VALIDATION',
    });
  });

  it('equals compara por valor', () => {
    const id = OrderId.create(VALID_UUID);
    expect(id.equals(OrderId.create(VALID_UUID))).toBe(true);
    expect(id.equals(OrderId.generate())).toBe(false);
  });
});
