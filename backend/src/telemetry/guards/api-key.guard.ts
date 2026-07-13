import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../../api-keys/services/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeysService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const apiKey = request.headers['x-api-key'] as string | undefined;

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
