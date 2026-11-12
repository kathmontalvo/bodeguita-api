import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Ruta donde se sirve la documentación interactiva (Swagger UI). */
export const SWAGGER_PATH = 'docs';

/**
 * Publica la documentación OpenAPI en /docs (UI) y /docs-json (JSON).
 * Se llama solo desde main.ts: los e2e no la necesitan.
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Bodeguita API')
    .setDescription(
      'Catálogo de productos con stock y registro de pedidos. ' +
        'Los montos van en soles (3.5 = S/ 3.50).',
    )
    .setVersion('1.0')
    .addTag('products', 'Catálogo: productos y stock')
    .addTag('orders', 'Pedidos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'Bodeguita API',
  });
}
