export interface ApiKeyListItemResponseDto {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  deviceLabel: string | null;
  createdAt: Date;
}

export interface CreatedApiKeyResponseDto extends ApiKeyListItemResponseDto {
  key: string;
}
