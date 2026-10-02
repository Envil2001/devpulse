export const METHOD_STYLES = {
  GET: 'bg-green-spring/10 text-green-spring border-green-spring/20',
  POST: 'bg-blue-frosty/10 text-blue-frosty border-blue-frosty/20',
  PUT: 'bg-purple-aspid/10 text-purple-aspid border-purple-aspid/20',
  PATCH: 'bg-purple-aspid/10 text-purple-aspid border-purple-aspid/20',
  DELETE: 'bg-red-fluor/10 text-red-fluor border-red-fluor/20',
} as const;

export type HttpMethod = keyof typeof METHOD_STYLES;

export function getMethodStyle(method: string): string {
  return METHOD_STYLES[method as HttpMethod] || METHOD_STYLES.GET;
}
