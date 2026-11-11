import { InvalidProductNameError } from '../errors/invalid-product-name.error';

export class ProductName {
  static readonly MAX_LENGTH = 100;

  private constructor(public readonly value: string) {}

  static create(raw: string): ProductName {
    const value = raw?.trim();
    if (!value) {
      throw new InvalidProductNameError('no puede estar vacío');
    }
    if (value.length > ProductName.MAX_LENGTH) {
      throw new InvalidProductNameError(
        `máximo ${ProductName.MAX_LENGTH} caracteres (tiene ${value.length})`,
      );
    }
    return new ProductName(value);
  }

  equals(other: ProductName): boolean {
    return this.value === other.value;
  }
}
