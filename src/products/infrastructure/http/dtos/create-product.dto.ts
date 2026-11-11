import { IsInt, IsNumber, IsString } from 'class-validator';

/**
 * Body de POST /products. Solo valida FORMA y TIPO.
 */
export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  price: number; // En soles: 3.5 = S/ 3.50. Máximo 2 decimales (céntimos). 

  @IsInt()
  stock: number;
}
