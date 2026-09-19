import { SetMetadata } from '@nestjs/common';

import { type ApiKeyScope } from '../enums/api-key.enums';

export const SCOPES_METADATA_KEY = 'requiredApiKeyScopes';

export const RequireScopes = (...scopes: Array<ApiKeyScope>): MethodDecorator & ClassDecorator =>
  SetMetadata(SCOPES_METADATA_KEY, scopes);
