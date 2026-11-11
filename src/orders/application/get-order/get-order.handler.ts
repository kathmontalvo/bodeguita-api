import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OrderNotFoundError } from '../../domain/errors/order-not-found.error';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../domain/ports/order.repository';
import { OrderId } from '../../domain/value-objects/order-id.vo';
import { OrderResponse, toOrderResponse } from '../order.response';
import { GetOrderQuery } from './get-order.query';

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  async execute(query: GetOrderQuery): Promise<OrderResponse> {
    // Id que no es UUID - 400 INVALID_ORDER_ID (lo lanza OrderId).
    const id = OrderId.create(query.orderId);

    const order = await this.orders.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id.value);
    }

    return toOrderResponse(order);
  }
}
