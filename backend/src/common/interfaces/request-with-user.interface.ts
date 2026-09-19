import { type Request } from 'express';

import { type ApiKeyScope } from '../../api-keys/enums/api-key.enums';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
  apiKeyScopes?: Array<ApiKeyScope>;
}
