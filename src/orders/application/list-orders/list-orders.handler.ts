import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../domain/ports/order.repository';
import { OrderResponse, toOrderResponse } from '../order.response';
import { ListOrdersQuery } from './list-orders.query';

@QueryHandler(ListOrdersQuery)
export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  async execute(): Promise<OrderResponse[]> {
    const orders = await this.orders.findAll();
    return orders.map(toOrderResponse);
  }
}
