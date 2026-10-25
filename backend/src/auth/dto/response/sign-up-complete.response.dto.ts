import { type TypeId } from '@devpulse/lib';

export class SignUpCompleteUserDto {
  public id!: TypeId<'users'>;
  public email!: string;
  public displayName!: string;
  public timezone!: string;
  public hourlyRate!: number;
  public currency!: string;
  public hasOpenaiKey!: boolean;
}

export class SignUpCompleteResponseDto {
  public message!: string;
  public user!: SignUpCompleteUserDto;
}
