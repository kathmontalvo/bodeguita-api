import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainExceptionFilter } from './shared/infrasctructure/domain-exception.filter';

/**
 * Configuración global de la app. La usan main.ts y los tests e2e, así los
 * tests prueban exactamente la misma app que se levanta en producción.
 */
export function setupApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
}
