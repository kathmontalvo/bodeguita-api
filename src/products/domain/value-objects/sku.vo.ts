import { InvalidSkuError } from "../errors/invalid-sku.error";

export class Sku {
  private static readonly PATTERN = /^[A-Z0-9-]+$/;

  private constructor(public readonly value: string) {}

  static create(raw: string): Sku {
    const value = raw?.trim().toUpperCase();
    if (!value || !Sku.PATTERN.test(value)) throw new InvalidSkuError(raw);
    return new Sku(value);
  }

  equals(other: Sku): boolean {
    return this.value === other.value;
  }
}