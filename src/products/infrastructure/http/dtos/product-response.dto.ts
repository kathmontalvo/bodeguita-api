import { ApiProperty } from '@nestjs/swagger';
import { ProductResponse } from '../../../application/product.response';

/**
 * Forma de ProductResponse para Swagger. La aplicación sigue usando la
 * interfaz; esta clase solo existe para documentar (vive en infraestructura
 * para que application/ no dependa de @nestjs/swagger).
 */
export class ProductResponseDto implements ProductResponse {
  @ApiProperty({
    format: 'uuid',
    example: '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c',
  })
  id: string;

  @ApiProperty({ example: 'INCA-500' })
  sku: string;

  @ApiProperty({ example: 'Inca Kola 500ml' })
  name: string;

  @ApiProperty({ description: 'En soles', example: 3.5 })
  price: number;

  @ApiProperty({ example: 24 })
  stock: number;
}
