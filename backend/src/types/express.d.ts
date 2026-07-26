import { type AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
      cookies: {
        access_token?: string;
        refresh_token?: string;
      };
    }
  }
}

export {};
