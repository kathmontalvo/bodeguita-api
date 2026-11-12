import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, ValidateNested } from 'class-validator';

/**
 * Body de POST /orders. Solo valida FORMA y TIPO.
 */
export class OrderItemDto {
  @ApiProperty({
    description: 'Debe existir en el catálogo (RN-007)',
    format: 'uuid',
    example: '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Entero mayor que 0 (RN-005), sin pasar el stock (RN-006)',
    example: 3,
  })
  @IsInt()
  quantity: number;
}

export class PlaceOrderDto {
  @ApiProperty({
    description:
      'Al menos un ítem (RN-004). Sin precios: se copian del catálogo (RN-008)',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
