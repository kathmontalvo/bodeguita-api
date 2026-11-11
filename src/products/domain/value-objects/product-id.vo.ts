import { randomUUID } from 'node:crypto';
import { InvalidProductIdError } from '../errors/invalid-product-id.error';

export class ProductId {
  private static readonly UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private constructor(public readonly value: string) {}

  /** Para productos nuevos: genera un UUID. */
  static generate(): ProductId {
    return new ProductId(randomUUID());
  }

  /** Para un id que ya existe (viene de la BD o de la URL): lo valida. */
  static create(raw: string): ProductId {
    const value = raw?.trim().toLowerCase();
    if (!value || !ProductId.UUID_PATTERN.test(value)) {
      throw new InvalidProductIdError(raw);
    }
    return new ProductId(value);
  }

  equals(other: ProductId): boolean {
    return this.value === other.value;
  }
}
