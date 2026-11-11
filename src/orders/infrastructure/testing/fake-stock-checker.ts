import {
  ProductAvailability,
  StockChecker,
} from '../../domain/ports/stock-checker';

/**
 * Adaptador de prueba de StockChecker: simula el catálogo con un Map.
 * Los productos que no se agregan con set() no existen (devuelve null).
 */
export class FakeStockChecker implements StockChecker {
  private readonly products = new Map<string, ProductAvailability>();

  set(productId: string, availability: ProductAvailability): this {
    this.products.set(productId, { ...availability });
    return this;
  }

  getAvailability(productId: string): Promise<ProductAvailability | null> {
    const product = this.products.get(productId);
    return Promise.resolve(product ? { ...product } : null);
  }
}
