import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
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

  @Post('signup/complete')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  public async signupComplete(
    @Body() dto: CompleteSignupRequestDto,
    @Headers('authorization') authHeader: string,
  ): Promise<SignUpCompleteResponseDto> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing signup token');
    }

    const signUpToken = authHeader.split(' ')[1];
    return this.authService.signUpComplete(dto, signUpToken);
  }

  @Post('signin/begin')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  public async signin(
    @Body() dto: LoginBeginRequestDto,
  ): Promise<{ salt: string; serverPublicKey: string }> {
    return this.authService.loginBegin(dto);
  }

  @Post('signin/verify')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  public async signinVerify(@Body() dto: LoginVerifyRequestDto): Promise<{ accessToken: string }> {
    const { email, clientProof } = dto;
    return this.authService.loginVerify(email, clientProof);
  }

  @Get('demo-token')
  public async getDemoToken() {
    return { token: await this.authService.getDemoToken() };
  }
}
