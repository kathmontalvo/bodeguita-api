import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/ports/product.repository';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { ProductResponse, toProductResponse } from '../product.response';
import { UpdateProductCommand } from './update-product.command';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: ProductRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<ProductResponse> {
    // Id que no es UUID → 400 INVALID_PRODUCT_ID.
    const id = ProductId.create(command.productId);

    const product = await this.products.findById(id);
    if (!product) {
      throw new ProductNotFoundError(id.value);
    }

    // Cada método valida con su value object (nombre, RN-002, RN-003).
    // Si uno falla, se lanza el error y no se guarda nada.
    const { name, price, stock } = command.changes;
    if (name !== undefined) product.rename(name);
    if (price !== undefined) product.changePrice(Math.round(price * 100));
    if (stock !== undefined) product.changeStock(stock);

    await this.products.save(product);
    return toProductResponse(product);
  }
}
