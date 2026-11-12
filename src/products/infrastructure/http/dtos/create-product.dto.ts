import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString } from 'class-validator';

/**
 * Body de POST /products. Solo valida FORMA y TIPO.
 */
export class CreateProductDto {
  @ApiProperty({
    description:
      'Único (RN-001). Solo A-Z, 0-9 y "-", máx. 50. Se guarda en mayúsculas',
    example: 'INCA-500',
  })
  @IsString()
  sku: string;

  @ApiProperty({
    description: 'Máx. 100 caracteres',
    example: 'Inca Kola 500ml',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'En soles, mayor que 0 (RN-002), máx. 2 decimales',
    example: 3.5,
  })
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  price: number; // En soles: 3.5 = S/ 3.50. Máximo 2 decimales (céntimos).

  @ApiProperty({
    description: 'Entero mayor o igual a 0 (RN-003)',
    example: 24,
  })
  @IsInt()
  stock: number;
}
