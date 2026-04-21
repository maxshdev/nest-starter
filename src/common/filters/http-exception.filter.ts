import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res?.message ?? exception.message;
      error = res?.error ?? exception.name;
    } else if (exception instanceof Error) {
      const code = (exception as any).code;

      if (code === 'ER_DUP_ENTRY' || code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'The resource already exists.';
        error = 'Duplicate Entry';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
        error = 'Bad Request';
      }

      this.logger.error(exception.stack ?? exception.message);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}
