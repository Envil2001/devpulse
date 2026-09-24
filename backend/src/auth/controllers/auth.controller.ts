import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { env } from '@devpulse/env/api';

import { AuthThrottle } from '../../common/decorators/throtte.decorators';
import { MessageResponseDto } from '../../common/dto/message-response.dto';
import { User } from '../../users/entities/user.entity';
import { UserRepository } from '../../users/repositories/users.repository';
import { CurrentUser } from '../decorators/current-user.decorator';
import { BeginSignupRequestDto } from '../dto/requests/begin-signup-request.dto';
import { CompleteSignupRequestDto } from '../dto/requests/complete-signup-request.dto';
import { LoginBeginRequestDto } from '../dto/requests/login-begin-request.dto';
import { LoginVerifyRequestDto } from '../dto/requests/login-verify-request.dto';
import { VerifySignUpRequestDto } from '../dto/requests/verify-signup-request.dto';
import { DemoTokenResponseDto } from '../dto/response/demo-token-response.dto';
import { LoginVerifyResponseDto } from '../dto/response/login-verify-response.dto';
import { SignUpCompleteResponseDto } from '../dto/response/sign-up-complete.response.dto';
import { UserResponseDto } from '../dto/response/user-response.dto';
import { VerifySignUpResponseDto } from '../dto/response/verify-signup-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepo: UserRepository,
  ) {}

  @Post('signup/begin')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  public async signupBegin(@Body() dto: BeginSignupRequestDto): Promise<MessageResponseDto> {
    return this.authService.signupBegin(dto);
  }

  @Post('signup/verify')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  public async signupVerify(@Body() dto: VerifySignUpRequestDto): Promise<VerifySignUpResponseDto> {
    return this.authService.signUpVerify(dto);
  }

  @Post('signin/verify')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  public async signinVerify(
    @Body() dto: LoginVerifyRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginVerifyResponseDto> {
    const { email, clientProof } = dto;
    return this.authService.loginVerify(email, clientProof, res);
  }

  @Post('signup/complete')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  public async signupComplete(
    @Body() dto: CompleteSignupRequestDto,
    @Headers('authorization') authHeader: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignUpCompleteResponseDto> {
    const signUpToken = authHeader.replace('Bearer ', '');
    return this.authService.signUpComplete(dto, signUpToken, res);
  }

  @Post('signin/begin')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  public async signinBegin(
    @Body() dto: LoginBeginRequestDto,
  ): Promise<{ salt: string; serverPublicKey: string }> {
    return this.authService.loginBegin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  public async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    const fullUser = await this.userRepo.findById(user.id);

    if (!fullUser) {
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        timezone: user.timezone,
        hourlyRate: user.hourlyRate,
        currency: user.currency,
        hasOpenaiKey: false,
      };
    }

    return {
      id: fullUser.id,
      email: fullUser.email,
      displayName: fullUser.displayName,
      timezone: fullUser.timezone,
      hourlyRate: fullUser.hourlyRate,
      currency: fullUser.currency,
      hasOpenaiKey: Boolean(fullUser.openaiKey),
    };
  }

  @Post('logout')
  public logout(@Res({ passthrough: true }) res: Response): MessageResponseDto {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  @Get('demo-token')
  public async getDemoToken(): Promise<DemoTokenResponseDto> {
    return { token: await this.authService.getDemoToken() };
  }
}
