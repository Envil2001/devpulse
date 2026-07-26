import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TypeId } from '@devpulse/lib';

import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  public async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      relations: ['encryption'],
    });
  }

  public async findByDisplayName(displayName: string): Promise<User | null> {
    return this.repository.findOne({
      where: { displayName },
      relations: ['encryption'],
    });
  }

  public async findById(id: TypeId<'users'>): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['encryption'],
    });
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const user = await this.repository.findOne({
      where: { email },
    });
    return !!user;
  }

  public async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  public async update(id: TypeId<'users'>, updates: Partial<User>): Promise<void> {
    await this.repository.update(id, updates);
  }
}
