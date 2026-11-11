import { InvalidPriceError } from '../errors/invalid-price.error';

/**
 * Monto en céntimos enteros (S/ 3.50 = 350) para evitar errores de decimales.
 * RN-002: el precio es mayor que 0.
 */
export class Money {
  private constructor(public readonly cents: number) {}

  static create(cents: number): Money {
    if (!Number.isInteger(cents) || cents <= 0) {
      throw new InvalidPriceError();
    }
    return new Money(cents);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
