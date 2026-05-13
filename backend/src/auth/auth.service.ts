import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { type TypeId } from '@devpulse/lib';

import { UsersService } from '../users/users.service';

import { type RegisterRequestDto } from './dto/register-request.dto';
import { type AuthenticatedUser, type JwtPayload } from './interfaces/jwt-payload.interface';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  public async validateLocalUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user?.isActive) {
      return null;
    }

    const isPasswordValid = await this.usersService.validatePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return { id: user.id, email: user.email };
  }

  public async register(dto: RegisterRequestDto): Promise<AuthResponse> {
    const user = await this.usersService.create(dto);
    const accessToken = this.generateAccessToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      accessToken,
    };
  }

  public async login(authenticatedUser: AuthenticatedUser): Promise<AuthResponse> {
    const userId = authenticatedUser.id as TypeId<'users'>;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.generateAccessToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      accessToken,
    };
  }

  public getProfile(authenticatedUser: AuthenticatedUser): AuthenticatedUser {
    return authenticatedUser;
  }

  private generateAccessToken(userId: TypeId<'users'>, email: string): string {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
