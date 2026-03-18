import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';

interface RequestWithUser {
  user: IJwtPayload;
}

export const CurrentUser = createParamDecorator(
  (data: keyof IJwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
