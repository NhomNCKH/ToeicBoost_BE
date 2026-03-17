import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorBody = {
      statusCode: status,
      error:
        typeof exceptionResponse === 'object' &&
        'error' in (exceptionResponse as Record<string, unknown>)
          ? (exceptionResponse as Record<string, unknown>).error
          : exception.name,
      message:
        typeof exceptionResponse === 'object' &&
        'message' in (exceptionResponse as Record<string, unknown>)
          ? (exceptionResponse as Record<string, unknown>).message
          : exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.warn(
      `${request.method} ${request.url} ${status} - ${JSON.stringify(errorBody.message)}`,
    );

    response.status(status).json(errorBody);
  }
}
