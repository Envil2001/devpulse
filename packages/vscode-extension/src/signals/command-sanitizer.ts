export function sanitizeCommand(raw: string): string {
  const MAX_LENGTH = 500;
  let result = raw.trim();

  // Normalize newlines to semicolons for better readability and classifier support
  result = result.replaceAll(/\r?\n+/g, '; ');

  result = result.replaceAll(/([a-z]+:\/\/)[^:@/\s]+:[^@/\s]+@/gi, '$1');

  result = result.replaceAll(/\bBearer\s+[A-Za-z0-9\-._~+/=]+/gi, 'Bearer [REDACTED]');

  result = result.replaceAll(
    /(--password|--token|--secret|--api-key|-p|-t)=([^\s]+)/gi,
    '$1=[REDACTED]',
  );

  if (result.length > MAX_LENGTH) {
    result = `${result.slice(0, MAX_LENGTH)}…`;
  }

  return result;
}
