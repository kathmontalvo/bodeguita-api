import { InvalidMoneyError } from '../errors/invalid-money.error';
import { Quantity } from './quantity.vo';

/**
 * Money de Orders: montos en céntimos enteros (S/ 3.50 = 350).
 */
export class Money {
  private constructor(public readonly cents: number) {}

  static create(cents: number): Money {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new InvalidMoneyError();
    }
    return new Money(cents);
  }

  static zero(): Money {
    return new Money(0);
  }

  /** Devuelve un Money nuevo; este no cambia. */
  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  /** Precio unitario × cantidad (RN-008). */
  multiply(quantity: Quantity): Money {
    return new Money(this.cents * quantity.value);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
