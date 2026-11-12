import { Query } from '@nestjs/cqrs';
import { OrderResponse } from '../order.response';

export class ListOrdersQuery extends Query<OrderResponse[]> {}
