import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';

/** Respuesta 201 de los endpoints que crean algo. */
export class IdResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c',
  })
  id: string;
}

/** Error de negocio: lo arma DomainExceptionFilter a partir de una DomainException. */
export class ErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({
    description: 'Código estable del error, pensado para el cliente',
    example: 'INSUFFICIENT_STOCK',
  })
  code: string;

  @ApiProperty({
    example:
      'Stock insuficiente para el producto 3f2b8c1e-…: se pidieron 6 y solo hay 5',
  })
  message: string;
}

/** Error de forma del body: lo arma el ValidationPipe de Nest (sin `code`). */
export class ValidationErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    type: [String],
    example: ['items.0.productId must be a UUID'],
  })
  message: string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}

/**
 * 400 con sus dos formas posibles: error de negocio (con `code`) o error de
 * forma del body (del ValidationPipe).
 */
export function ApiBadRequest(description: string) {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto, ValidationErrorResponseDto),
    ApiBadRequestResponse({
      description,
      schema: {
        oneOf: [
          { $ref: getSchemaPath(ErrorResponseDto) },
          { $ref: getSchemaPath(ValidationErrorResponseDto) },
        ],
      },
    }),
  );
}
