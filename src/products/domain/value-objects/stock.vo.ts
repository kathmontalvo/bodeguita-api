import { InsufficientStockError } from '../errors/insufficient-stock.error';
import { InvalidStockError } from '../errors/invalid-stock.error';

/** RN-003: el stock es un entero y nunca es negativo. */
export class Stock {
  private constructor(public readonly value: number) {}

  static create(value: number): Stock {
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidStockError(
        `${value}. Debe ser un entero mayor o igual a 0`,
      );
    }
    return new Stock(value);
  }

  /** Devuelve un stock nuevo; este no cambia (es inmutable). */
  decrease(quantity: number): Stock {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidStockError(
        `la cantidad a descontar (${quantity}) debe ser un entero mayor que 0`,
      );
    }
    if (quantity > this.value) {
      throw new InsufficientStockError(quantity, this.value);
    }
    return new Stock(this.value - quantity);
  }

  equals(other: Stock): boolean {
    return this.value === other.value;
  }
}
