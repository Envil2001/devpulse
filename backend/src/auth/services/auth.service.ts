import * as crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { DataSource } from 'typeorm';

import { env } from '@devpulse/env/api';
import { generateSrpServerKey, TypeId, typeIdGenerator, verifySrpClientProof } from '@devpulse/lib';

import { MessageResponseDto } from '../../common/dto/message-response.dto';
import { RedisService } from '../../redis/services/redis.service';
import { User } from '../../users/entities/user.entity';
import { UserEncryption } from '../../users/entities/user-encryption.entity';
import { UsersService } from '../../users/services/users.service';
import { bannedWords, blockedUsernames, reservedUsernames } from '../constants/banned-names';
import { BeginSignupRequestDto } from '../dto/requests/begin-signup-request.dto';
import { CompleteSignupRequestDto } from '../dto/requests/complete-signup-request.dto';
import { LoginBeginRequestDto } from '../dto/requests/login-begin-request.dto';
import { VerifySignUpRequestDto } from '../dto/requests/verify-signup-request.dto';
import { SignUpCompleteResponseDto } from '../dto/response/sign-up-complete.response.dto';
import { VerifySignUpResponseDto } from '../dto/response/verify-signup-response.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private disposableDomains = new Set<string>();

  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  public async onModuleInit(): Promise<void> {
    await this.loadDisposableDomains();
  }

  public async signupBegin(dto: BeginSignupRequestDto): Promise<MessageResponseDto> {
    const { email, displayName } = dto;
    const successMessage = 'A verification code has been sent to your email.';

    this.logger.log(`Starting signup process for email: ${email}`);

    const isDisposableEmail = this.isDisposableEmail(email);

    if (isDisposableEmail) {
      this.logger.warn(`Signup attempt with disposable email: ${email}`);

      return { message: successMessage };
    }

    const isBannedName =
      blockedUsernames.includes(displayName.toLowerCase()) ||
      reservedUsernames.includes(displayName.toLowerCase()) ||
      bannedWords.some((word) => displayName.toLowerCase().includes(word));

    if (isBannedName) {
      this.logger.warn(`Signup attempt with banned display name: ${displayName}`);
      return { message: successMessage };
    }

    const [userEmail, userByUsername] = await Promise.all([
      this.usersService.findByEmail(email),
      this.usersService.findByDisplayName(displayName),
    ]);

    if (userEmail || userByUsername) {
      this.logger.warn(`Signup attempt for existing email: ${email}`);
      return { message: successMessage };
    }

    const verificationCode = crypto.randomInt(100_000, 999_999).toString();

    const redisKey = `signup_code:${email}`;
    const payload = { code: verificationCode, displayName };

    try {
      await this.redisService.set(redisKey, payload, 600);
      this.logger.debug(`Generated verification code for ${email}: ${verificationCode}`);
      // TODO: Implement email sending functionality here. For now, we just log the code.
      // await this.emailService.sendVerificationCode(email, verificationCode);
    } catch (error) {
      this.logger.error(`Error saving verification code for ${email}: ${String(error)}`);
      throw new InternalServerErrorException(
        'Could not generate verification code. Please try again.',
      );
    }

    return { message: successMessage };
  }

  public async signUpVerify(dto: VerifySignUpRequestDto): Promise<VerifySignUpResponseDto> {
    const { email, code } = dto;

    this.logger.log(`Verifying signup for email: ${email}`);

    const redisKey = `signup_code:${email}`;
    const storedData = await this.redisService.get<{ code: string; displayName: string }>(redisKey);

    if (storedData?.code !== code) {
      this.logger.warn(`Invalid or expired verification code for email: ${email}`);
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.redisService.del(redisKey);

    const signupToken = this.jwtService.sign(
      {
        email,
        displayName: storedData.displayName,
        purpose: 'signup',
      },
      { expiresIn: '15m' },
    );

    return {
      message: 'Email verified successfully.',
      signupToken,
    };
  }

  public async signUpComplete(
    dto: CompleteSignupRequestDto,
    signUpToken: string,
    res: Response,
  ): Promise<SignUpCompleteResponseDto> {
    const {
      salt,
      verifier,
      publicKey,
      encryptedPrivateKey,
      iv,
      tag,
      protectedKey,
      protectedKeyIV,
      protectedKeyTag,
      timezone,
    } = dto;
    let decodedToken: { email: string; displayName: string; purpose: string };

    try {
      decodedToken = this.jwtService.verify(signUpToken);

      if (decodedToken.purpose !== 'signup') {
        this.logger.warn(`Invalid signup token purpose for email: ${decodedToken.email}`);
        throw new UnauthorizedException('Invalid signup token');
      }
    } catch (error) {
      this.logger.warn(`Invalid or expired signup token: ${String(error)}`);
      throw new UnauthorizedException('Invalid or expired signup token');
    }

    const { email, displayName } = decodedToken;

    return await this.dataSource.transaction(async (manager) => {
      const existingByEmail = await manager.findOne(User, { where: { email } });
      const existingByName = await manager.findOne(User, { where: { displayName } });
      if (existingByEmail || existingByName) {
        throw new BadRequestException('User with this email or display name already exists');
      }

      const userRepo = manager.getRepository(User);
      const encryptionRepo = manager.getRepository(UserEncryption);

      const newUser = userRepo.create({
        id: typeIdGenerator('users'),
        email,
        displayName,
        timezone: timezone ?? 'UTC',
      });

      const savedUser = await userRepo.save(newUser);

      const newEncryption = encryptionRepo.create({
        id: typeIdGenerator('encryption'),
        user: savedUser,
        iv,
        salt,
        verifier,
        publicKey,
        encryptedPrivateKey,
        tag,
        protectedKey,
        protectedKeyIV,
        protectedKeyTag,
      });
      await encryptionRepo.save(newEncryption);

      this.logger.log(`User created successfully: ${email}`);

      const accessToken = this.jwtService.sign({
        sub: savedUser.id,
        email: savedUser.email,
        displayName: savedUser.displayName,
      });

      this.logger.debug(`Access token generated for user: ${email}`);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      return {
        message: 'Registration completed successfully',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          displayName: savedUser.displayName,
          timezone: savedUser.timezone,
        },
      };
    });
  }

  public async loginBegin(
    dto: LoginBeginRequestDto,
  ): Promise<{ salt: string; serverPublicKey: string }> {
    const { email, clientPublicKey } = dto;

    this.logger.log(`Starting login process for email: ${email}`);

    const user = await this.usersService.findByEmail(email);

    if (!user?.encryption.salt || !user.encryption.verifier) {
      this.logger.warn(`Login attempt for non-existent email: ${email}`);
      throw new BadRequestException('User does not exist');
    }

    const { pubKey: serverPublicKey, privateKey: serverPrivateKey } = await generateSrpServerKey(
      user.encryption.salt,
      user.encryption.verifier,
    );

    const loginSession = {
      userId: user.id,
      clientPublicKey,
      serverPublicKey,
      serverPrivateKey,
    };

    await this.redisService.set(`login_session:${email}`, loginSession, 300);

    return {
      salt: user.encryption.salt,
      serverPublicKey,
    };
  }

  public async loginVerify(
    email: string,
    clientProof: string,
    res: Response,
  ): Promise<{ accessToken: string }> {
    this.logger.log(`Verifying login for email: ${email}`);

    const loginSession = await this.redisService.get<{
      userId: TypeId<'users'>;
      clientPublicKey: string;
      serverPublicKey: string;
      serverPrivateKey: string;
    }>(`login_session:${email}`);

    if (!loginSession) {
      this.logger.warn(`No active login session found for email: ${email}`);
      throw new BadRequestException('No active login session found');
    }

    const { userId, clientPublicKey, serverPublicKey } = loginSession;

    const user = await this.usersService.findById(userId);
    if (!user?.encryption) {
      this.logger.error(`User or encryption data not found for ID: ${userId}`);
      throw new BadRequestException('User data not found');
    }

    const { salt, verifier } = user.encryption;

    if (!salt || !verifier) {
      this.logger.error(`Salt or verifier is null for user ID: ${userId}`);
      throw new BadRequestException('Invalid user encryption data');
    }

    const isValidProof = await verifySrpClientProof(
      salt,
      verifier,
      serverPublicKey,
      clientPublicKey,
      clientProof,
    );

    if (!isValidProof) {
      this.logger.warn(`Invalid client proof for email: ${email}`);
      throw new UnauthorizedException('Invalid client proof');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    await this.redisService.del(`login_session:${email}`);

    this.logger.log(`Login successful for email: ${email}`);
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { accessToken };
  }

  public logout(res: Response): MessageResponseDto {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  public async getDemoToken(): Promise<string> {
    const user = await this.usersService.findByEmail('demo@devpulse.com');
    if (!user) throw new NotFoundException();

    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    });
  }

  private async loadDisposableDomains(): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'disposable_emails.txt');
      const disposableEmailsText = await fs.readFile(filePath, 'utf8');
      const domains = disposableEmailsText
        .split('\n')
        .map((line) => line.trim())
        .filter((e) => e.length > 0 && !e.startsWith('#'));

      this.disposableDomains = new Set(domains);
      this.logger.log(`Loaded ${String(this.disposableDomains.size)} disposable email domains.`);
    } catch (error) {
      this.logger.warn(
        'Could not load disposable email domains. Proceeding without checks.',
        String(error),
      );
    }
  }

  private isDisposableEmail(email: string): boolean {
    const [, domain] = email.split('@');
    if (!domain) return false;
    return this.disposableDomains.has(domain.toLowerCase());
  }
}
