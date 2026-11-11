import { captureError } from '../../../shared/testing/capture-error';
import { InvalidSkuError } from '../errors/invalid-sku.error';
import { Sku } from './sku.vo';

describe('Sku', () => {
  it('acepta letras, números y guiones', () => {
    expect(Sku.create('INCA-500').value).toBe('INCA-500');
  });

  it('quita espacios y pasa a mayúsculas', () => {
    expect(Sku.create('  abc-1 ').value).toBe('ABC-1');
  });

  it.each(['', '   ', 'ABC 1', 'ABC_1', 'ÑANDÚ', 'A/B'])(
    'rechaza "%s"',
    (raw) => {
      expect(() => Sku.create(raw)).toThrow(InvalidSkuError);
    },
  );

  it('el error tiene code INVALID_SKU y kind VALIDATION', () => {
    expect(captureError(() => Sku.create(''))).toMatchObject({
      code: 'INVALID_SKU',
      kind: 'VALIDATION',
    });
  });

  it('equals compara por valor', () => {
    expect(Sku.create('abc-1').equals(Sku.create('ABC-1'))).toBe(true);
    expect(Sku.create('ABC-1').equals(Sku.create('ABC-2'))).toBe(false);
  });
});
