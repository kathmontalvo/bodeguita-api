import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiBadRequest,
  ErrorResponseDto,
  IdResponseDto,
} from '../../../shared/infrastructure/http/api-responses';
import { CreateProductCommand } from '../../application/create-product/create-product.command';
import { GetProductQuery } from '../../application/get-product/get-product.query';
import { ListProductsQuery } from '../../application/list-products/list-products.query';
import { ProductResponse } from '../../application/product.response';
import { UpdateProductCommand } from '../../application/update-product/update-product.command';
import { CreateProductDto } from './dtos/create-product.dto';
import { ProductResponseDto } from './dtos/product-response.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

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

  /** Sin ParseUUIDPipe: el id lo valida ProductId en el dominio. */
  @Get(':id')
  @ApiOperation({ summary: 'Ver un producto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequest('INVALID_PRODUCT_ID: el id no es un UUID')
  @ApiNotFoundResponse({
    description: 'PRODUCT_NOT_FOUND',
    type: ErrorResponseDto,
  })
  get(@Param('id') id: string): Promise<ProductResponse> {
    return this.queryBus.execute(new GetProductQuery(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar nombre, precio y/o stock',
    description:
      'Solo cambia los campos que se envían. El SKU no se puede cambiar. ' +
      'Los pedidos ya registrados conservan su precio (RN-008).',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'Producto actualizado',
    type: ProductResponseDto,
  })
  @ApiBadRequest(
    'INVALID_PRODUCT_ID, INVALID_PRODUCT_NAME, INVALID_PRICE, INVALID_STOCK, o body con forma incorrecta (incluye enviar sku)',
  )
  @ApiNotFoundResponse({
    description: 'PRODUCT_NOT_FOUND',
    type: ErrorResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponse> {
    return this.commandBus.execute(
      new UpdateProductCommand(id, {
        name: dto.name,
        price: dto.price,
        stock: dto.stock,
      }),
    );
  }
}
