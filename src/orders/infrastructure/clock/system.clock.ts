import { Injectable } from '@nestjs/common';
import { Clock } from '../../domain/ports/clock';

/** Adaptador real de Clock: la hora del sistema. Único new Date() de Orders. */
@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
