import { Server } from 'node:http';

import { type INestApplication } from '@nestjs/common';

export function getHttpServer(app: INestApplication): Server {
  const server: unknown = app.getHttpServer();

  if (!(server instanceof Server)) {
    throw new TypeError('Nest application did not return an http.Server instance');
  }

  return server;
}
