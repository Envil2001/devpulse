import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiKeysController } from './controllers/api-keys.controller';
import { ApiKey } from './entities/api-key.entity';
import { ApiKeysRepository } from './repository/api-keys.repository';
import { ApiKeysService } from './services/api-keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeysRepository],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
