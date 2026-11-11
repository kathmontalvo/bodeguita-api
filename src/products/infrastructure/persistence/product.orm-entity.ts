import { Check, Column, Entity, PrimaryColumn, Unique } from 'typeorm';
import { ProductName } from '../../domain/value-objects/product-name.vo';
import { Sku } from '../../domain/value-objects/sku.vo';

/**
 * Forma de la tabla products. NO es la entidad de dominio: no tiene reglas
 * ni métodos, solo columnas. ProductMapper traduce entre esta clase y Product.
 */
@Entity({ name: 'products' })
@Unique('UQ_products_sku', ['sku'])
@Check('CHK_products_price_cents_positive', '"price_cents" > 0')
@Check('CHK_products_stock_non_negative', '"stock" >= 0')
export class ProductOrmEntity {
  /** Lo genera el dominio (ProductId.generate()), no la BD. */
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: Sku.MAX_LENGTH })
  sku: string;

  @Column({ type: 'varchar', length: ProductName.MAX_LENGTH })
  name: string;

  @Column({ name: 'price_cents', type: 'integer' })
  priceCents: number;

  @Column({ type: 'integer' })
  stock: number;
}
