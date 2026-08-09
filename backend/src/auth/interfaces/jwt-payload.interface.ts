import { type TypeId } from '@devpulse/lib';

export interface AuthenticatedUser {
  id: TypeId<'users'>;
  email: string;
  displayName: string;
  timezone: string | null;
  hourlyRate: number;
  currency: string;
}
