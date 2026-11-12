import { Command } from '@nestjs/cqrs';
import { ProductResponse } from '../product.response';

/**
 * Campos que se pueden cambiar. Los que no vienen se dejan como están.
 * El SKU no está: es la identidad de negocio del producto (RN-001).
 */
export interface ProductChanges {
  name?: string;
  price?: number; // En soles, tal como llega a la API (3.5 = S/ 3.50).
  stock?: number;
}

export class UpdateProductCommand extends Command<ProductResponse> {
  constructor(
    public readonly productId: string,
    public readonly changes: ProductChanges,
  ) {
    super();
  }
}
