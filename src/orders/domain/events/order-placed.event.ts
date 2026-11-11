/**
 * Evento de dominio: "se registró un pedido". Es una clase simple, sin
 * decoradores de Nest. El handler de PlaceOrder lo publica en el EventBus
 * después de guardar, y Catálogo lo escucha para descontar stock (etapa 9).
 *
 * Solo lleva lo que el listener necesita: qué productos y cuántos.
 */
export class OrderPlaced {
  constructor(
    public readonly orderId: string,
    public readonly items: ReadonlyArray<{
      readonly productId: string;
      readonly quantity: number;
    }>,
    public readonly occurredAt: Date,
  ) {}
}
