import { BaseService } from '@/shared/api/base.service';
import type { User } from '@/shared/types';

export interface UpdateUserDto {
  displayName?: string;
  timezone: string;
  hourlyRate?: number;
  currency?: string;
}

export class UsersService extends BaseService {
  async updateMe(dto: UpdateUserDto): Promise<User> {
    return this.patch<User, UpdateUserDto>('/users/me', dto);
  }
}
