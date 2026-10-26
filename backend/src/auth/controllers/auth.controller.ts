import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { AuthThrottle } from '../../common/decorators/throtte.decorators';
import { MessageResponseDto } from '../../common/dto/message-response.dto';
import { UserRepository } from '../../users/repositories/users.repository';
import { CurrentUser } from '../decorators/current-user.decorator';
import { BeginSignupRequestDto } from '../dto/requests/begin-signup-request.dto';
import { CompleteSignupRequestDto } from '../dto/requests/complete-signup-request.dto';
import { LoginBeginRequestDto } from '../dto/requests/login-begin-request.dto';
import { LoginVerifyRequestDto } from '../dto/requests/login-verify-request.dto';
import { VerifySignUpRequestDto } from '../dto/requests/verify-signup-request.dto';
import { LoginVerifyResponseDto } from '../dto/response/login-verify-response.dto';
import { SignUpCompleteResponseDto } from '../dto/response/sign-up-complete.response.dto';
import { UserResponseDto } from '../dto/response/user-response.dto';
import { VerifySignUpResponseDto } from '../dto/response/verify-signup-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { type LoginBeginResult } from '../interfaces/auth-internal.interface';
import { type AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import { AuthService } from '../services/auth.service';

const BEARER_PREFIX = 'Bearer ';

const extractBearerToken = (authHeader: string | undefined): string => {
  const token = authHeader?.startsWith(BEARER_PREFIX)
    ? authHeader.slice(BEARER_PREFIX.length).trim()
    : '';

  if (!token) {
    throw new UnauthorizedException('Missing bearer token');
  }

  return token;
};

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepo: UserRepository,
  ) {}

  @Post('signup/begin')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Begin signup process (verify email)' })
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponseDto })
  public async signupBegin(@Body() dto: BeginSignupRequestDto): Promise<MessageResponseDto> {
    return this.authService.signupBegin(dto);
  }

  @Post('signup/verify')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify signup code' })
  @ApiResponse({ status: HttpStatus.OK, type: VerifySignUpResponseDto })
  public async signupVerify(@Body() dto: VerifySignUpRequestDto): Promise<VerifySignUpResponseDto> {
    return this.authService.signUpVerify(dto);
  }

  @Post('signin/verify')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify login proof' })
  @ApiResponse({ status: HttpStatus.OK, type: LoginVerifyResponseDto })
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
  @ApiOperation({ summary: 'Complete signup process' })
  @ApiResponse({ status: HttpStatus.OK, type: SignUpCompleteResponseDto })
  public async signupComplete(
    @Body() dto: CompleteSignupRequestDto,
    @Headers('authorization') authHeader: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignUpCompleteResponseDto> {
    return this.authService.signUpComplete(dto, extractBearerToken(authHeader), res);
  }

  @Post('signin/begin')
  @AuthThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Begin login process (get salt and server key)' })
  public async signinBegin(@Body() dto: LoginBeginRequestDto): Promise<LoginBeginResult> {
    return this.authService.loginBegin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  public async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    const fullUser = await this.userRepo.findById(user.id);

    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: fullUser.id,
      email: fullUser.email,
      displayName: fullUser.displayName,
      timezone: fullUser.timezone,
      hourlyRate: fullUser.hourlyRate,
      currency: fullUser.currency,
      hasOpenaiKey: Boolean(fullUser.openaiKey),
      llmProvider: fullUser.llmProvider,
      llmModel: fullUser.llmModel,
      llmBaseUrl: fullUser.llmBaseUrl,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear cookies' })
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponseDto })
  public logout(@Res({ passthrough: true }) res: Response): MessageResponseDto {
    return this.authService.logout(res);
  }
}
