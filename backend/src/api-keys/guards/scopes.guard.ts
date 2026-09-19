import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { SCOPES_METADATA_KEY } from '../decorators/require-scopes.decorator';
import { ApiKeyScope } from '../enums/api-key.enums';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<Array<ApiKeyScope>>(
      SCOPES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const grantedScopes = request.apiKeyScopes ?? [];

    const hasAllScopes = requiredScopes.every((scope) => grantedScopes.includes(scope));

    if (!hasAllScopes) {
      throw new ForbiddenException(
        `This API key is missing required scope(s): ${requiredScopes.join(', ')}`,
      );
    }

    return true;
  }
}
