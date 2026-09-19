export enum ApiKeyScope {
  TELEMETRY_WRITE = 'telemetry:write',
  ANALYTICS_READ = 'analytics:read',
}

export enum ApiKeyType {
  EXTENSION = 'extension',
  INTEGRATION = 'integration',
}

export const SCOPES_BY_KEY_TYPE: Record<ApiKeyType, Array<ApiKeyScope>> = {
  [ApiKeyType.EXTENSION]: [ApiKeyScope.TELEMETRY_WRITE],
  [ApiKeyType.INTEGRATION]: [ApiKeyScope.ANALYTICS_READ],
};
