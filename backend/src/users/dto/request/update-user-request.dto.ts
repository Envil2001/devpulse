import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import type { LlmProviderId } from '../../../worklog/interfaces/llm-config.interface';
import { LLM_PROVIDER_IDS } from '../../../worklog/interfaces/llm-config.interface';
export class UpdateUserRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public timezone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  public hourlyRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  public currency?: string;

  @IsOptional()
  @IsString()
  public openaiKey?: string;

  @IsOptional()
  @IsIn(LLM_PROVIDER_IDS)
  public llmProvider?: LlmProviderId;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  public llmModel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  public llmBaseUrl?: string | null;
}
