import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * Body de PATCH /products/:id. Mismos campos y validaciones que al crear,
 * todos opcionales, y sin SKU: si llega `sku`, el ValidationPipe responde 400
 * (forbidNonWhitelisted).
 */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['sku'] as const),
) {}
