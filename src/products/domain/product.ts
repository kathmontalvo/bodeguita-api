import { Money } from './value-objects/money.vo';
import { ProductId } from './value-objects/product-id.vo';
import { ProductName } from './value-objects/product-name.vo';
import { Sku } from './value-objects/sku.vo';
import { Stock } from './value-objects/stock.vo';

/** Forma plana del producto: la usan el mapper, el repositorio y las respuestas. */
export interface ProductPrimitives {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  stock: number;
}

export type CreateProductProps = Omit<ProductPrimitives, 'id'>;

/** Agregado raíz del contexto de Catálogo. */
export class Product {
  private constructor(
    private readonly id: ProductId,
    private readonly sku: Sku,
    private name: ProductName,
    private price: Money,
    private stock: Stock,
  ) {}

  /** Producto nuevo: genera el id y valida todo con los value objects. */
  static create(props: CreateProductProps): Product {
    return new Product(
      ProductId.generate(),
      Sku.create(props.sku),
      ProductName.create(props.name),
      Money.create(props.priceCents),
      Stock.create(props.stock),
    );
  }

  /** Reconstruye un producto que ya existe (desde la BD); conserva su id. */
  static fromPrimitives(data: ProductPrimitives): Product {
    return new Product(
      ProductId.create(data.id),
      Sku.create(data.sku),
      ProductName.create(data.name),
      Money.create(data.priceCents),
      Stock.create(data.stock),
    );
  }

  /** Cambia el nombre. ProductName valida que no esté vacío ni pase el máximo. */
  rename(name: string): void {
    this.name = ProductName.create(name);
  }

  /**
   * Cambia el precio (RN-002: mayor que 0). Los pedidos ya registrados no
   * cambian: guardan su propia copia del precio (RN-008).
   */
  changePrice(priceCents: number): void {
    this.price = Money.create(priceCents);
  }

  /**
   * Fija el stock a un valor nuevo (reposición o ajuste de inventario).
   * RN-003: Stock no acepta negativos.
   */
  changeStock(stock: number): void {
    this.stock = Stock.create(stock);
  }

  /** RN-003 / RN-006: lanza INSUFFICIENT_STOCK si no alcanza. */
  decreaseStock(quantity: number): void {
    this.stock = this.stock.decrease(quantity);
  }

  toPrimitives(): ProductPrimitives {
    return {
      id: this.id.value,
      sku: this.sku.value,
      name: this.name.value,
      priceCents: this.price.cents,
      stock: this.stock.value,
    };
  }
}
