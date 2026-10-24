import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { BadRequestException } from '@nestjs/common';

const PRIVATE_IPV4_PATTERNS: ReadonlyArray<RegExp> = [
  /^0\./,
  /^10\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
];

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    return PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(address));
  }

  const lower = address.toLowerCase();

  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) return true;
  if (lower.startsWith('::ffff:')) return isPrivateAddress(lower.slice('::ffff:'.length));

  return false;
}

export async function assertSafeBaseUrl(raw: string, allowPrivate: boolean): Promise<string> {
  let url: URL;

  try {
    url = new URL(raw.trim());
  } catch {
    throw new BadRequestException('Base URL is not a valid URL.');
  }

  if (url.username || url.password) {
    throw new BadRequestException('Base URL must not contain credentials.');
  }

  const normalized = url.toString().replace(/\/$/, '');

  if (allowPrivate) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new BadRequestException('Base URL must use http or https.');
    }

    return normalized;
  }

  if (url.protocol !== 'https:') {
    throw new BadRequestException('Base URL must use https.');
  }

  const host = url.hostname.replaceAll(/^\[|\]$/g, '');

  const addresses =
    isIP(host) === 0
      ? await lookup(host, { all: true }).catch(() => {
          throw new BadRequestException('Base URL host cannot be resolved.');
        })
      : [{ address: host }];

  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new BadRequestException('Base URL must not point to a private or local address.');
  }

  return normalized;
}
