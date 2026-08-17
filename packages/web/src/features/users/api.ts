import { BaseService } from '@/shared/api/base.service';
import { User } from '../auth/api';

export interface UpdateUserDto {
  displayName?: string;
  timezone?: string;
  hourlyRate?: number;
  currency?: string;
}

export class UsersService extends BaseService {
  async updateMe(dto: UpdateUserDto): Promise<User> {
    return this.patch<User, UpdateUserDto>('/users/me', dto);
  }
}

export const usersService = new UsersService();
