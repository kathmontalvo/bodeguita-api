import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, ValidateNested } from 'class-validator';

/**
 * Body de POST /orders. Solo valida FORMA y TIPO.
 */
export class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  quantity: number;
}

export class PlaceOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
