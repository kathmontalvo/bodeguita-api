import { Body, Controller, Get, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductCommand } from '../../application/create-product/create-product.command';
import { ListProductsQuery } from '../../application/list-products/list-products.query';
import { ProductResponse } from '../../application/product.response';
import { CreateProductDto } from './dtos/create-product.dto';

/**
 * Adaptador de entrada HTTP. No tiene lógica: traduce la petición a un
 * command o query y lo manda al bus. No conoce el repositorio ni el dominio.
 */
@Controller('products')
export class ProductsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** 201 { id } · 400 INVALID_* · 409 PRODUCT_SKU_ALREADY_EXISTS */
  @Post()
  create(@Body() dto: CreateProductDto): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateProductCommand(dto.sku, dto.name, dto.price, dto.stock),
    );
  }

  /** 200 ProductResponse[] (precio en soles) */
  @Get()
  list(): Promise<ProductResponse[]> {
    return this.queryBus.execute(new ListProductsQuery());
  }
}
