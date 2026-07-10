import { env } from '@devpulse/env/api';
import { TypeId } from '@devpulse/lib';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/services/users.service';

interface JwtPayload {
  sub: TypeId<'users'>;
  email: string;
  displayName: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }
}
