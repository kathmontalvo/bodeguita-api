import { Command } from '@nestjs/cqrs';

/**
 * Datos para crear un producto. 
 *
 * Extender Command<{ id: string }> le dice a TypeScript qué devuelve
 * commandBus.execute(new CreateProductCommand(...)).
 */
export class CreateProductCommand extends Command<{ id: string }> {
  constructor(
    public readonly sku: string,
    public readonly name: string,
    public readonly price: number, // En soles, tal como llega a la API (3.5 = S/ 3.50).
    public readonly stock: number,
  ) {
    super();
  }
}
