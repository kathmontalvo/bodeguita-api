import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
import { GetOrderQuery } from '../../application/get-order/get-order.query';
import { ListOrdersQuery } from '../../application/list-orders/list-orders.query';
import { OrderResponse } from '../../application/order.response';
import { PlaceOrderCommand } from '../../application/place-order/place-order.command';
import { OrderResponseDto } from './dtos/order-response.dto';
import { PlaceOrderDto } from './dtos/place-order.dto';

/**
 * Adaptador de entrada HTTP de Orders.
 */
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar un pedido',
    description:
      'Copia el precio actual de cada producto. El stock se descuenta después, por el evento OrderPlaced.',
  })
  @ApiCreatedResponse({ description: 'Pedido registrado', type: IdResponseDto })
  @ApiBadRequest(
    'ORDER_WITHOUT_ITEMS (RN-004), INVALID_QUANTITY (RN-005), o body con forma incorrecta',
  )
  @ApiNotFoundResponse({
    description: 'PRODUCT_NOT_FOUND (RN-007)',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'INSUFFICIENT_STOCK (RN-006)',
    type: ErrorResponseDto,
  })
  place(@Body() dto: PlaceOrderDto): Promise<{ id: string }> {
    return this.commandBus.execute(
      new PlaceOrderCommand(
        dto.items.map(({ productId, quantity }) => ({ productId, quantity })),
      ),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar pedidos, del más reciente al más antiguo' })
  @ApiOkResponse({ type: [OrderResponseDto] })
  list(): Promise<OrderResponse[]> {
    return this.queryBus.execute(new ListOrdersQuery());
  }

  /** Sin ParseUUIDPipe: el id lo valida OrderId en el dominio. */
  @Get(':id')
  @ApiOperation({ summary: 'Ver un pedido con subtotales y total' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiBadRequest('INVALID_ORDER_ID: el id no es un UUID')
  @ApiNotFoundResponse({
    description: 'ORDER_NOT_FOUND',
    type: ErrorResponseDto,
  })
  get(@Param('id') id: string): Promise<OrderResponse> {
    return this.queryBus.execute(new GetOrderQuery(id));
  }
}
