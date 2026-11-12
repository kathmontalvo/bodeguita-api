import { Body, Controller, Get, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiBadRequest,
  ErrorResponseDto,
  IdResponseDto,
} from '../../../shared/infrastructure/http/api-responses';
import { CreateProductCommand } from '../../application/create-product/create-product.command';
import { ListProductsQuery } from '../../application/list-products/list-products.query';
import { ProductResponse } from '../../application/product.response';
import { CreateProductDto } from './dtos/create-product.dto';
import { ProductResponseDto } from './dtos/product-response.dto';

/**
 * Adaptador de entrada HTTP. No tiene lógica: traduce la petición a un
 * command o query y lo manda al bus. No conoce el repositorio ni el dominio.
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un producto' })
  @ApiCreatedResponse({ description: 'Producto creado', type: IdResponseDto })
  @ApiBadRequest(
    'INVALID_SKU, INVALID_PRODUCT_NAME, INVALID_PRICE, INVALID_STOCK, o body con forma incorrecta',
  )
  @ApiConflictResponse({
    description: 'PRODUCT_SKU_ALREADY_EXISTS (RN-001)',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateProductDto): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateProductCommand(dto.sku, dto.name, dto.price, dto.stock),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos con su stock actual' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  list(): Promise<ProductResponse[]> {
    return this.queryBus.execute(new ListProductsQuery());
  }
}
