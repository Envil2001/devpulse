import { type Request } from 'express';

import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}
