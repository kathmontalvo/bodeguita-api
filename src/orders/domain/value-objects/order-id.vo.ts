import { randomUUID } from 'node:crypto';
import { InvalidOrderIdError } from '../errors/invalid-order-id.error';

export class OrderId {
  private static readonly UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private constructor(public readonly value: string) {}

  /** Para pedidos nuevos: genera un UUID v4. */
  static generate(): OrderId {
    return new OrderId(randomUUID());
  }

  /** Para un id que ya existe (BD o URL): lo valida. */
  static create(raw: string): OrderId {
    const value = raw?.trim().toLowerCase();
    if (!value || !OrderId.UUID_PATTERN.test(value)) {
      throw new InvalidOrderIdError(raw);
    }
    return new OrderId(value);
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }
}
