import { type TypeId } from '@devpulse/lib';

import type { LlmProviderId } from '../../../worklog/interfaces/llm-config.interface';

export class UserResponseDto {
  public id!: TypeId<'users'>;
  public email!: string;
  public displayName!: string;
  public timezone!: string;
  public hourlyRate!: number;
  public currency!: string;
  public hasOpenaiKey!: boolean;
  public llmProvider!: LlmProviderId | null;
  public llmModel!: string | null;
  public llmBaseUrl!: string | null;
}
