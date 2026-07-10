import { Injectable, Logger } from '@nestjs/common';

import { type TypeId } from '@devpulse/lib/ids';

import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  public async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return this.userRepository.findByEmail(normalizedEmail);
  }

  public async findByDisplayName(displayName: string): Promise<User | null> {
    return this.userRepository.findByDisplayName(displayName);
  }

  public async findById(id: TypeId<'users'>): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  public async existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(email.toLowerCase().trim());
  }

  public async save(user: User): Promise<User> {
    this.logger.log(`Saving user: ${user.email}`);
    return this.userRepository.save(user);
  }
}
