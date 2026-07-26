import { type TypeId } from '@devpulse/lib';

export class SignUpCompleteUserDto {
  public id!: TypeId<'users'>;
  public email!: string;
  public displayName!: string;
  public timezone!: string | null;
}

export class SignUpCompleteResponseDto {
  public message!: string;
  public user!: SignUpCompleteUserDto;
}
