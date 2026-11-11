import { ProductRepository } from '../../domain/ports/product.repository';
import { Product, ProductPrimitives } from '../../domain/product';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { Sku } from '../../domain/value-objects/sku.vo';

/**
 * Adaptador de prueba del puerto ProductRepository: guarda los productos en un
 * Map. Se usa en los tests de los handlers para no depender de Postgres.
 *
 * Guarda primitivos (no la instancia) para comportarse como una BD real:
 * cambiar un producto que devolvió find* no cambia lo guardado hasta save().
 */
export class InMemoryProductRepository implements ProductRepository {
  private readonly rows = new Map<string, ProductPrimitives>();

  save(product: Product): Promise<void> {
    const data = product.toPrimitives();
    this.rows.set(data.id, data);
    return Promise.resolve();
  }

  findById(id: ProductId): Promise<Product | null> {
    const data = this.rows.get(id.value);
    return Promise.resolve(data ? Product.fromPrimitives(data) : null);
  }

  findBySku(sku: Sku): Promise<Product | null> {
    const data = [...this.rows.values()].find((row) => row.sku === sku.value);
    return Promise.resolve(data ? Product.fromPrimitives(data) : null);
  }

  findAll(): Promise<Product[]> {
    return Promise.resolve(
      [...this.rows.values()].map((row) => Product.fromPrimitives(row)),
    );
  }
}
