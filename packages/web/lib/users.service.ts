import { User } from './auth.service';
import { BaseService } from './base.service';

export interface UpdateUserDto {
  displayName?: string;
  timezone?: string;
}

export class UsersService extends BaseService {
  async updateMe(dto: UpdateUserDto): Promise<User> {
    return this.patch<User, UpdateUserDto>('/users/me', dto);
  }
}
