import { TypeId } from '@devpulse/lib';

export class SignUpCompleteUserDto {
  id!: TypeId<'users'>;
  email!: string;
  displayName!: string;
}

export class SignUpCompleteResponseDto {
  message!: string;
  user!: SignUpCompleteUserDto;
}
