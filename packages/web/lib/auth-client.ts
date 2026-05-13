import { postJson } from './api-client';

export interface AuthUserDto {
  id: string;
  email: string;
  displayName: string | null;
}

export interface AuthResponseDto {
  user: AuthUserDto;
  accessToken: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export async function register(request: RegisterRequestDto): Promise<AuthResponseDto> {
  return postJson<AuthResponseDto, RegisterRequestDto>('/auth/register', request);
}

export async function login(request: LoginRequestDto): Promise<AuthResponseDto> {
  return postJson<AuthResponseDto, LoginRequestDto>('/auth/login', request);
}
