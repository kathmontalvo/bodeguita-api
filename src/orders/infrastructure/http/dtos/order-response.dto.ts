import { ApiProperty } from '@nestjs/swagger';
import {
  OrderItemResponse,
  OrderResponse,
} from '../../../application/order.response';

/**
 * Forma de OrderResponse para Swagger. La aplicación sigue usando las
 * interfaces; estas clases solo existen para documentar.
 */
export class OrderItemResponseDto implements OrderItemResponse {
  @ApiProperty({
    format: 'uuid',
    example: '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c',
  })
  productId: string;

  @ApiProperty({ example: 3 })
  quantity: number;

  @ApiProperty({
    description: 'En soles, copiado del catálogo al registrar (RN-008)',
    example: 3.5,
  })
  unitPrice: number;

  @ApiProperty({ description: 'unitPrice × quantity, en soles', example: 10.5 })
  subtotal: number;
}

export class OrderResponseDto implements OrderResponse {
  @ApiProperty({
    format: 'uuid',
    example: 'b7a2a2e1-9b43-4d1c-aa6a-24da0e831c30',
  })
  id: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-11T21:32:40.164Z' })
  placedAt: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({
    description: 'Suma de los subtotales, en soles',
    example: 10.5,
  })
  total: number;
}
