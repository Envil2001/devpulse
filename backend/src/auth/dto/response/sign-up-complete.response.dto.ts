import { type TypeId } from '@devpulse/lib';

export class SignUpCompleteUserDto {
  public id!: TypeId<'users'>;
  public email!: string;
  public displayName!: string;
}

export class SignUpCompleteResponseDto {
  public message!: string;
  public user!: SignUpCompleteUserDto;
}
