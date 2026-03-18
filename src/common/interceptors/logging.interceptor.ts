import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
};

function ts(): string {
  return `${c.gray}${new Date().toLocaleTimeString('vi-VN', { hour12: false })}${c.reset}`;
}

function methodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: c.green,
    POST: c.cyan,
    PUT: c.yellow,
    PATCH: c.yellow,
    DELETE: c.red,
  };
  return `${colors[method] || c.white}${method}${c.reset}`;
}

function statusBadge(status: number): string {
  if (status < 300) return `${c.bgGreen}${c.bold} ${status} ${c.reset}`;
  if (status < 400) return `${c.bgYellow}${c.bold} ${status} ${c.reset}`;
  return `${c.bgRed}${c.bold} ${status} ${c.reset}`;
}

function durationColor(ms: number): string {
  if (ms < 100) return `${c.green}${ms}ms${c.reset}`;
  if (ms < 500) return `${c.yellow}${ms}ms${c.reset}`;
  return `${c.red}${c.bold}${ms}ms${c.reset}`;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        const elapsed = Date.now() - now;

        console.log(
          `${ts()} ${c.green}→${c.reset} ${methodColor(method)} ${c.white}${url}${c.reset} ${statusBadge(response.statusCode)} ${durationColor(elapsed)}`,
        );
      }),
    );
  }
}
