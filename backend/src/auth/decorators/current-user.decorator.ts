import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { type AuthenticatedUser } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new Error('User not found in request. Did you forget @UseGuards(JwtAuthGuard)?');
    }

    return request.user;
  },
);
