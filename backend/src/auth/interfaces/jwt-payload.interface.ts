import { TypeId } from '@devpulse/lib';

export interface AuthenticatedUser {
  id: TypeId<'users'>;
  email: string;
  displayName: string;
}
