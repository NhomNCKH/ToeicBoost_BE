import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
};

function ts(): string {
  return `${c.gray}${new Date().toLocaleTimeString('vi-VN', { hour12: false })}${c.reset}`;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    console.log(
      `${ts()} ${c.bgRed}${c.bold} CRITICAL ${c.reset} ${c.red}${request.method} ${request.url} [${status}]${c.reset}`,
    );
    console.log(`${ts()}           ${c.red}${message}${c.reset}`);
    if (exception instanceof Error && exception.stack) {
      console.log(`${c.dim}${exception.stack}${c.reset}`);
    }

    response.status(status).json({
      statusCode: status,
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Something went wrong'
          : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
