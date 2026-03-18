import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
};

function ts(): string {
  return `${c.gray}${new Date().toLocaleTimeString('vi-VN', { hour12: false })}${c.reset}`;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'object' &&
      'message' in (exceptionResponse as Record<string, unknown>)
        ? (exceptionResponse as Record<string, unknown>).message
        : exception.message;

    const errorName =
      typeof exceptionResponse === 'object' &&
      'error' in (exceptionResponse as Record<string, unknown>)
        ? (exceptionResponse as Record<string, unknown>).error
        : exception.name;

    if (status >= 500) {
      console.log(
        `${ts()} ${c.bgRed}${c.bold} ${status} ${c.reset} ${c.red}${request.method} ${request.url}${c.reset} ${c.red}${JSON.stringify(message)}${c.reset}`,
      );
    } else {
      console.log(
        `${ts()} ${c.bgYellow}${c.bold} ${status} ${c.reset} ${c.yellow}${request.method} ${request.url}${c.reset} ${c.yellow}${JSON.stringify(message)}${c.reset}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      error: errorName,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
