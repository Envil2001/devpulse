import { type TypeId } from '@devpulse/lib';

export class UserResponseDto {
  public id!: TypeId<'users'>;
  public email!: string;
  public displayName!: string;
  public timezone!: string | null;
  public hourlyRate!: number;
  public currency!: string;
}
