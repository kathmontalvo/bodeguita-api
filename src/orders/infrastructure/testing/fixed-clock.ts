import { Clock } from '../../domain/ports/clock';

/** Adaptador de prueba de Clock: siempre devuelve la misma fecha. */
export class FixedClock implements Clock {
  constructor(private readonly date: Date) {}

  now(): Date {
    return new Date(this.date.getTime());
  }
}
