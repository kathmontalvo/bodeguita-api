import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DomainErrorKind, DomainException } from '../domain/domain.exception';

const STATUS_BY_KIND: Record<DomainErrorKind, number> = {
  VALIDATION: HttpStatus.BAD_REQUEST, // 400
  NOT_FOUND: HttpStatus.NOT_FOUND, // 404
  CONFLICT: HttpStatus.CONFLICT, // 409
};

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_KIND[exception.kind];

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}