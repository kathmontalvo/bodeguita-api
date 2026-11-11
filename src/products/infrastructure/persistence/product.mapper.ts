import { Product } from '../../domain/product';
import { ProductOrmEntity } from './product.orm-entity';

/**
 * Traduce entre la entidad de dominio (Product) y la fila de la tabla
 * (ProductOrmEntity). Es el único lugar que conoce las dos formas.
 */
export const ProductMapper = {
  /** Fila de la BD - Product. Usa fromPrimitives: conserva el id guardado. */
  toDomain(row: ProductOrmEntity): Product {
    return Product.fromPrimitives({
      id: row.id,
      sku: row.sku,
      name: row.name,
      priceCents: row.priceCents,
      stock: row.stock,
    });
  },

  /** Product - fila lista para repository.save(). */
  toOrm(product: Product): ProductOrmEntity {
    const { id, sku, name, priceCents, stock } = product.toPrimitives();
    const row = new ProductOrmEntity();
    row.id = id;
    row.sku = sku;
    row.name = name;
    row.priceCents = priceCents;
    row.stock = stock;
    return row;
  },
};
