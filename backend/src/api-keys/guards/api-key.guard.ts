import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { ApiKeysService } from '../services/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeysService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const headers = request.headers;
    const apiKey = typeof headers['x-api-key'] === 'string' ? headers['x-api-key'] : undefined;

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    const result = await this.apiKeyService.validateApiKey(apiKey);

    if (!result) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.user = result.user;
    request.apiKeyScopes = result.scopes;

    return true;
  }
}
