import { Server } from 'node:http';

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { AppModule } from '../app.module';

export interface TestApp {
  app: INestApplication;
  httpServer: Server;
}

export async function createTestApp(): Promise<TestApp> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.init();

  const httpServer = getHttpServer(app);

  return { app, httpServer };
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}

function getHttpServer(app: INestApplication): Server {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const server = app.getHttpServer();

  if (!(server instanceof Server)) {
    throw new TypeError('Nest application did not return an http.Server instance');
  }

  return server as Server;
}
