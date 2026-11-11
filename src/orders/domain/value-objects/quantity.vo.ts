import { InvalidQuantityError } from '../errors/invalid-quantity.error';

/** RN-005: cantidad de un ítem del pedido, entero mayor que 0. */
export class Quantity {
  private constructor(public readonly value: number) {}

  static create(value: number): Quantity {
    if (!Number.isInteger(value) || value <= 0) {
      throw new InvalidQuantityError(value);
    }
    return new Quantity(value);
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }
}
