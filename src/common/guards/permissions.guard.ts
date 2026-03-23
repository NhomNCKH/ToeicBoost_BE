import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';

interface RequestWithUser {
  user: IJwtPayload;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const permissions = new Set(user.permissions ?? []);
    const hasPermission = requiredPermissions.some((permission) =>
      permissions.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Requires one of permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
