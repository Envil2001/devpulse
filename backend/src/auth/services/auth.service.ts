import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import fs from 'fs/promises';
import path from 'path';
import { UsersService } from '../../users/services/users.service';
import { BeginSignupRequestDto } from '../dto/requests/begin-signup-request.dto';
import { MessageResponseDto } from '../../common/dto/message-response.dto';
import { RedisService } from '../../redis/services/redis.service';
import { bannedWords, blockedUsernames, reservedUsernames } from '../constants/banned-names';
import { VerifySignUpResponseDto } from '../dto/response/verify-signup-response.dto';
import { VerifySignUpRequestDto } from '../dto/requests/verify-signup-request.dto';
import { CompleteSignupRequestDto } from '../dto/requests/complete-signup-request.dto';
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserEncryption } from '../../users/entities/user.encryption';
import { LoginBeginRequestDto } from '../dto/requests/login-begin-request.dto';
import { generateSrpServerKey, TypeId, verifySrpClientProof } from '@devpulse/lib';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private disposableDomains: Set<string> = new Set();
  private domainsLoaded: boolean = false;

  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  public async signupBegin(dto: BeginSignupRequestDto): Promise<MessageResponseDto> {
    const { email, displayName } = dto;
    const successMessage = 'A verification code has been sent to your email.';

    this.logger.log(`Starting signup process for email: ${email}`);

    const isDisposableEmail = await this.isDisposableEmail(email);

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

    try {
      // TODO: generate a verification code more protected way, e.g., using a secure random generator
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const redisKey = `signup_code:${email}`;
      const payload = { code: verificationCode, displayName };
      await this.redisService.set(redisKey, payload, 600);

      this.logger.debug(`Generated verification code for ${email}: ${verificationCode}`);
    } catch (error) {
      this.logger.error(`Error occurred while generating verification code for ${email}: ${error}`);
    }

    return { message: successMessage };
  }

  public async signUpVerify(dto: VerifySignUpRequestDto): Promise<VerifySignUpResponseDto> {
    const { email, code } = dto;

    this.logger.log(`Verifying signup for email: ${email}`);

    const redisKey = `signup_code:${email}`;
    const storedData = await this.redisService.get<{ code: string; displayName: string }>(redisKey);

    if (!storedData || storedData.code !== code) {
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

  public async signUpComplete(dto: CompleteSignupRequestDto, signUpToken: string): Promise<any> {
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
    } = dto;
    let decodedToken: { email: string; displayName: string; purpose: string };

    try {
      decodedToken = this.jwtService.verify(signUpToken);

      if (decodedToken.purpose !== 'signup') {
        this.logger.warn(`Invalid signup token purpose for email: ${decodedToken.email}`);
        throw new UnauthorizedException('Invalid signup token');
      }
    } catch (error) {
      this.logger.warn(`Invalid or expired signup token: ${error}`);
      throw new UnauthorizedException('Invalid or expired signup token');
    }

    const { email, displayName } = decodedToken;

    return await this.dataSource.transaction(async (manager) => {
      const existingUser = await manager.findOne(User, {
        where: { email, displayName },
      });

      if (existingUser) {
        this.logger.warn(`Attempt to complete signup for existing user: ${email}`);
        throw new BadRequestException('User already exists');
      }

      const userRepo = manager.getRepository(User);
      const encryptionRepo = manager.getRepository(UserEncryption);

      const newUser = userRepo.create({
        email,
        displayName,
      });

      const savedUser = await userRepo.save(newUser);

      const newEncryption = encryptionRepo.create({
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
      return {
        message: 'Registration completed successfully',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          displayName: savedUser.displayName,
        },
        accessToken,
      };
    });
  }

  public async loginBegin(
    dto: LoginBeginRequestDto,
  ): Promise<{ salt: string; serverPublicKey: string }> {
    const { email, clientPublicKey } = dto;

    this.logger.log(`Starting login process for email: ${email}`);

    const user = await this.usersService.findByEmail(email);

    if (!user || !user.encryption || !user.encryption.salt || !user.encryption.verifier) {
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
      serverPrivateKey,
      salt: user.encryption.salt,
      verifier: user.encryption.verifier,
    };

    await this.redisService.set(`login_session:${email}`, loginSession, 300);

    return {
      salt: user.encryption.salt,
      serverPublicKey,
    };
  }

  public async loginVerify(email: string, clientProof: string): Promise<{ accessToken: string }> {
    this.logger.log(`Verifying login for email: ${email}`);

    const loginSession = await this.redisService.get<{
      userId: TypeId<'users'>;
      clientPublicKey: string;
      serverPrivateKey: string;
      salt: string;
      verifier: string;
    }>(`login_session:${email}`);

    if (!loginSession) {
      this.logger.warn(`No active login session found for email: ${email}`);
      throw new BadRequestException('No active login session found');
    }

    const { userId, clientPublicKey, serverPrivateKey, salt, verifier } = loginSession;

    const isValidProof = await verifySrpClientProof(
      salt,
      verifier,
      serverPrivateKey,
      clientPublicKey,
      clientProof,
    );

    if (!isValidProof) {
      this.logger.warn(`Invalid client proof for email: ${email}`);
      throw new UnauthorizedException('Invalid client proof');
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      this.logger.error(`User not found for ID: ${userId}`);
      throw new BadRequestException('User not found');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    await this.redisService.del(`login_session:${email}`);

    this.logger.log(`Login successful for email: ${email}`);
    return { accessToken };
  }

  public async getDemoToken() {
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
      const disposableEmailsText = await fs.readFile(filePath, 'utf-8');
      const domains = disposableEmailsText
        .split('\n')
        .map((line) => line.trim())
        .filter((e) => e.length > 0 && !e.startsWith('#'));

      this.disposableDomains = new Set(domains);

      this.domainsLoaded = true;

      this.logger.log(
        `Loaded ${this.disposableDomains.size} disposable email domains from ${filePath}`,
      );
    } catch {
      this.logger.warn(
        'Could not load disposable email domains. Proceeding without disposable email checks.',
      );
      this.domainsLoaded = true;
    }
  }

  private async isDisposableEmail(email: string): Promise<boolean> {
    if (!this.domainsLoaded) {
      await this.loadDisposableDomains();
    }

    const [, domain] = email.split('@');

    if (!domain) {
      this.logger.warn(`Invalid email format: ${email}`);
      return false;
    }

    return this.disposableDomains.has(domain.toLowerCase());
  }
}
