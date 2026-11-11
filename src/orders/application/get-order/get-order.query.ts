import { Query } from '@nestjs/cqrs';
import { OrderResponse } from '../order.response';

export class GetOrderQuery extends Query<OrderResponse> {
  constructor(public readonly orderId: string) {
    super();
  }
}
