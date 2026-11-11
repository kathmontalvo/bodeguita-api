import { Product } from '../domain/product';


export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  price: number; // En soles: 3.5 = S/ 3.50
  stock: number;
}

export function toProductResponse(product: Product): ProductResponse {
  const { id, sku, name, priceCents, stock } = product.toPrimitives();
  return { id, sku, name, price: priceCents / 100, stock };
}
