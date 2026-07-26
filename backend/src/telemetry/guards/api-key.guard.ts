import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { ApiKeysService } from '../../api-keys/services/api-keys.service';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

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

    const user = await this.apiKeyService.validateApiKey(apiKey);

    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.user = user;
    return true;
  }
}
