import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { type TypeId } from '@devpulse/lib/ids';

import { normalizeEmail } from '../../common/utils/normalize-email';
import { assertSafeBaseUrl } from '../../worklog/llm/validate-base-url';
import { type User } from '../entities/user.entity';
import { UserRepository } from '../repositories/users.repository';

export type UpdatableUserFields = Partial<
  Pick<
    User,
    | 'displayName'
    | 'timezone'
    | 'hourlyRate'
    | 'currency'
    | 'openaiKey'
    | 'llmProvider'
    | 'llmModel'
    | 'llmBaseUrl'
  >
>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  public async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(normalizeEmail(email));
  }

  public async findByDisplayName(displayName: string): Promise<User | null> {
    return this.userRepository.findByDisplayName(displayName);
  }

  public async findById(id: TypeId<'users'>): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  public async existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(normalizeEmail(email));
  }

  public async save(user: User): Promise<User> {
    this.logger.log(`Saving user: ${user.id}`);
    return this.userRepository.save(user);
  }

  public async update(userId: TypeId<'users'>, updates: UpdatableUserFields): Promise<User> {
    if (updates.displayName) {
      const existing = await this.userRepository.findByDisplayName(updates.displayName);
      if (existing && existing.id !== userId) {
        throw new ConflictException('Display name is already taken');
      }
    }

    if (updates.llmBaseUrl !== undefined && updates.llmBaseUrl !== null) {
      await assertSafeBaseUrl(
        updates.llmBaseUrl,
        process.env.LLM_ALLOW_PRIVATE_BASE_URL === 'true',
      );
    }

    await this.userRepository.update(userId, updates);
    const updated = await this.findById(userId);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    this.logger.log(`Updated user ${userId}`);
    return updated;
  }
}
