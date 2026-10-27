import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { type TypeId } from '@devpulse/lib';

import { type UserResponseDto } from '../../auth/dto/response/user-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { getHttpServer } from '../../test/get-http-server';
import { type UpdateUserRequestDto } from '../dto/request/update-user-request.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

import { UsersController } from './users.controller';

describe('UsersController (Integration)', () => {
  let app: INestApplication;

  const mockUserEntity = Object.assign(new User(), {
    id: 'u_user123',
    email: 'dev@devpulse.io',
    displayName: 'Dev User',
    timezone: 'UTC',
    hourlyRate: 60,
    currency: 'USD',
    openaiKey: 'sk-secret-key-123',
    llmProvider: 'openai',
    llmModel: 'gpt-4o',
    llmBaseUrl: null,
  });

  const mockUsersService = {
    update: jest.fn((_userId: TypeId<'users'>, _dto: UpdateUserRequestDto) =>
      Promise.resolve(mockUserEntity),
    ),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{
            headers: { authorization?: string };
            user?: User;
          }>();

          if (req.headers.authorization === 'Bearer valid-jwt') {
            req.user = mockUserEntity;
            return true;
          }
          throw new UnauthorizedException();
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 when updating profile without token', async () => {
    const response = await request(getHttpServer(app))
      .patch('/users/me')
      .send({ displayName: 'Hacker' });

    expect(response.status).toBe(401);
  });

  it('should update user profile and return correctly mapped DTO', async () => {
    const payload: UpdateUserRequestDto = {
      displayName: 'New Dev Name',
      timezone: 'Europe/Warsaw',
    };

    const response = await request(getHttpServer(app))
      .patch('/users/me')
      .set('Authorization', 'Bearer valid-jwt')
      .send(payload);

    const body = response.body as UserResponseDto;

    expect(response.status).toBe(200);
    expect(mockUsersService.update).toHaveBeenCalledWith('u_user123', payload);

    expect(body.id).toBe('u_user123');
    expect(body.hasOpenaiKey).toBe(true);
    expect(body.llmProvider).toBe('openai');

    expect(body).not.toHaveProperty('openaiKey');
  });
});
