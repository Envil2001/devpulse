const HTTP_USERINFO = /^(https?:\/\/)[^/@\s]+@/i;
const SECRET_USERINFO = /^([a-z][a-z0-9+.-]*:\/\/)[^/@\s:]+:[^/@\s]+@/i;

export function stripUrlCredentials(url: string): string {
  return url.trim().replace(HTTP_USERINFO, '$1').replace(SECRET_USERINFO, '$1');
}
