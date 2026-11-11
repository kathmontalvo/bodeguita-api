import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProductSkuAlreadyExistsError } from '../../domain/errors/product-sku-already-exists.error';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/ports/product.repository';
import { Product } from '../../domain/product';
import { Sku } from '../../domain/value-objects/sku.vo';
import { CreateProductCommand } from './create-product.command';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<{ id: string }> {
    // 1. El dominio valida SKU, nombre, precio y stock (RN-002, RN-003).
    //    Math.round evita errores de decimales
    const product = Product.create({
      sku: command.sku,
      name: command.name,
      priceCents: Math.round(command.price * 100),
      stock: command.stock,
    });

    // 2. RN-001: el SKU es único. Necesita la BD, por eso va aquí y no en la entidad.
    const { id, sku } = product.toPrimitives();
    if (await this.products.findBySku(Sku.create(sku))) {
      throw new ProductSkuAlreadyExistsError(sku);
    }

    await this.products.save(product);
    return { id };
  }
}
