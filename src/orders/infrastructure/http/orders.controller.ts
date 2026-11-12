import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetOrderQuery } from '../../application/get-order/get-order.query';
import { OrderResponse } from '../../application/order.response';
import { PlaceOrderCommand } from '../../application/place-order/place-order.command';
import { PlaceOrderDto } from './dtos/place-order.dto';

/**
 * Adaptador de entrada HTTP de Orders. 
 */
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 201 { id } · 400 ORDER_WITHOUT_ITEMS, INVALID_QUANTITY
   * · 404 PRODUCT_NOT_FOUND · 409 INSUFFICIENT_STOCK
   */
  @Post()
  place(@Body() dto: PlaceOrderDto): Promise<{ id: string }> {
    return this.commandBus.execute(
      new PlaceOrderCommand(
        dto.items.map(({ productId, quantity }) => ({ productId, quantity })),
      ),
    );
  }

  /**
   * 200 OrderResponse · 400 INVALID_ORDER_ID · 404 ORDER_NOT_FOUND
   * Sin ParseUUIDPipe: el id lo valida OrderId en el dominio.
   */
  @Get(':id')
  get(@Param('id') id: string): Promise<OrderResponse> {
    return this.queryBus.execute(new GetOrderQuery(id));
  }
}
