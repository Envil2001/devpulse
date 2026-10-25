import { type TypeId } from '@devpulse/lib';

export interface SignupCodeRecord {
  code: string;
  displayName: string;
  attempts: number;
  expiresAt: number;
}

export interface SignupTokenPayload {
  email: string;
  displayName: string;
}

export interface LoginSession {
  userId: TypeId<'users'>;
  clientPublicKey: string;
  serverPublicKey: string;
}

export interface LoginBeginResult {
  salt: string;
  serverPublicKey: string;
}
