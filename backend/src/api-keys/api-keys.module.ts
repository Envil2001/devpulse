import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiKey } from './entities/api-key.entity';
import { ApiKeysController } from './controllers/api-keys.controller';
import { ApiKeysService } from './services/api-keys.service';
import { ApiKeysRepository } from './repository/api-keys.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeysRepository],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
