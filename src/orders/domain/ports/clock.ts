export const CLOCK = Symbol('CLOCK');

/**
 * Puerto para obtener la hora actual. El dominio y los handlers nunca usan
 * new Date(): así en los tests se inyecta un reloj fijo (FixedClock) y la
 * fecha del pedido es predecible.
 */
export interface Clock {
  now(): Date;
}
