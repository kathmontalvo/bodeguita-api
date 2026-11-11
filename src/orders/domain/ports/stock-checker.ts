export const STOCK_CHECKER = Symbol('STOCK_CHECKER');

/** Lo que Orders necesita saber de un producto para aceptar un ítem. */
export interface ProductAvailability {
  stock: number;
  priceCents: number;
}

/**
 * Puerto de Orders para consultar Products. (ÚNICO punto)
 */
export interface StockChecker {
  getAvailability(productId: string): Promise<ProductAvailability | null>;
}
