import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { AuthThrottle } from '../common/decorators/throtte.decorators';

import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterRequestDto } from './dto/register-request.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import type { AuthenticatedUser } from './interfaces/jwt-payload.interface';
import { type AuthResponse, AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @AuthThrottle()
  @HttpCode(HttpStatus.CREATED)
  public register(@Body() dto: RegisterRequestDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @AuthThrottle()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  public login(@CurrentUser() user: AuthenticatedUser): Promise<AuthResponse> {
    return this.authService.login(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  public getProfile(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return this.authService.getProfile(user);
  }
}
