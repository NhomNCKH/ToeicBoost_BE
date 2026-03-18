import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class AuthInputMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const body = req.body as Record<string, unknown>;

    if (typeof body?.email === 'string') {
      body.email = body.email.trim().toLowerCase();
    }

    if (typeof body?.name === 'string') {
      body.name = body.name.trim().replace(/\s+/g, ' ');
    }

    next();
  }
}
