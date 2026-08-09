import { BaseService } from './base.service';

export interface User {
  id: string;
  email: string;
  displayName: string;
  timezone: string | null;
  hourlyRate: number;
  currency: string;
}
interface BeginSignupRequest {
  displayName: string;
  email: string;
}

interface VerifySignupRequest {
  email: string;
  code: string;
}

interface VerifySignupResponse {
  signupToken: string;
}

interface CompleteSignupRequest {
  salt: string;
  verifier: string;
  publicKey: string;
  encryptedPrivateKey: string;
  iv: string;
  tag: string;
  protectedKey: string;
  protectedKeyIV: string;
  protectedKeyTag: string;
  timezone?: string;
}

interface CompleteSignupResponse {
  message: string;
  user: User;
}

interface LoginBeginRequest {
  email: string;
  clientPublicKey: string;
}

interface LoginBeginResponse {
  salt: string;
  serverPublicKey: string;
}

interface LoginVerifyRequest {
  email: string;
  clientProof: string;
}

interface LoginVerifyResponse {
  accessToken: string;
}

interface LogoutResponse {
  message: string;
}

export class AuthService extends BaseService {
  async loginBegin(email: string, clientPublicKey: string): Promise<LoginBeginResponse> {
    return this.post<LoginBeginResponse, LoginBeginRequest>('/auth/signin/begin', {
      email,
      clientPublicKey,
    });
  }

  async loginVerify(email: string, clientProof: string): Promise<LoginVerifyResponse> {
    return this.post<LoginVerifyResponse, LoginVerifyRequest>('/auth/signin/verify', {
      email,
      clientProof,
    });
  }

  async signupBegin(email: string, displayName: string): Promise<{ message: string }> {
    return this.post<{ message: string }, BeginSignupRequest>('/auth/signup/begin', {
      email,
      displayName,
    });
  }

  async signupVerify(email: string, code: string): Promise<VerifySignupResponse> {
    return this.post<VerifySignupResponse, VerifySignupRequest>('/auth/signup/verify', {
      email,
      code,
    });
  }

  async signupComplete(
    dto: CompleteSignupRequest,
    signupToken: string,
  ): Promise<CompleteSignupResponse> {
    return this.post<CompleteSignupResponse, CompleteSignupRequest>('/auth/signup/complete', dto, {
      authToken: signupToken,
    });
  }

  async logout(): Promise<LogoutResponse> {
    return this.post<LogoutResponse, Record<string, never>>('/auth/logout', {});
  }

  async getMe(): Promise<User> {
    return this.get<User>('/auth/me');
  }
}
