import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from '../services/auth.service';
import { AuthThrottle } from '../../common/decorators/throtte.decorators';
import { BeginSignupRequestDto } from '../dto/requests/begin-signup-request.dto';
import { MessageResponseDto } from '../../common/dto/message-response.dto';
import { VerifySignUpRequestDto } from '../dto/requests/verify-signup-request.dto';
import { VerifySignUpResponseDto } from '../dto/response/verify-signup-response.dto';
import { CompleteSignupRequestDto } from '../dto/requests/complete-signup-request.dto';
import { LoginBeginRequestDto } from '../dto/requests/login-begin-request.dto';
import { LoginVerifyRequestDto } from '../dto/requests/login-verify-request.dto';
import { SignUpCompleteResponseDto } from '../dto/response/sign-up-complete.response.dto';
import type { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../users/entities/user.entity';
import { env } from '@devpulse/env/api';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  ): Promise<{ accessToken: string }> {
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
  ) {
    const signUpToken = authHeader?.replace('Bearer ', '');
    return this.authService.signUpComplete(dto, signUpToken, res);
  }

  @Post('signin/begin')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  public async signin(
    @Body() dto: LoginBeginRequestDto,
  ): Promise<{ salt: string; serverPublicKey: string }> {
    return this.authService.loginBegin(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: Request) {
    const user = req.user as User;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  @Get('demo-token')
  public async getDemoToken() {
    return { token: await this.authService.getDemoToken() };
  }
}
