export const METHOD_STYLES = {
  GET: 'border-brand/30 bg-brand/10 text-brand',
  POST: 'border-blue-frosty/30 bg-blue-frosty/10 text-blue-frosty',
  PUT: 'border-yellow-amber/30 bg-yellow-amber/10 text-yellow-amber',
  PATCH: 'border-orange-signal/30 bg-orange-signal/10 text-orange-signal',
  DELETE: 'border-red-coral/30 bg-red-coral/10 text-red-coral',
} as const;

export type HttpMethod = keyof typeof METHOD_STYLES;

export function getMethodStyle(method: string): string {
  return METHOD_STYLES[method as HttpMethod] || METHOD_STYLES.GET;
}
