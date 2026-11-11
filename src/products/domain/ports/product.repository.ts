import { Product } from '../product';
import { ProductId } from '../value-objects/product-id.vo';
import { Sku } from '../value-objects/sku.vo';


export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

/**
 * Puerto de salida de Catálogo. 
 * El dominio y los handlers solo conocen esta interfaz; 
 * los adaptadores (en memoria y TypeORM) la implementan.
 */
export interface ProductRepository {
  // Inserta o actualiza (upsert por id). 
  save(product: Product): Promise<void>;
  findById(id: ProductId): Promise<Product | null>;
  /** RN-001: el handler de CreateProduct lo usa para validar SKU único. */
  findBySku(sku: Sku): Promise<Product | null>;
  findAll(): Promise<Product[]>;
}
