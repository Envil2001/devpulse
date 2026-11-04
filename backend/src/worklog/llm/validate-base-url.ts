import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { BadRequestException, Logger } from '@nestjs/common';

const logger = new Logger('ValidateBaseUrl');

const PRIVATE_IPV4_PATTERNS: ReadonlyArray<RegExp> = [
  /^0\./,
  /^10\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^(22[4-9]|23\d|24\d|25[0-5])\./,
];

export interface SafeBaseUrl {
  baseURL: string;
  resolvedIps: ReadonlyArray<string>;
}

function expandIpv6(address: string): Array<number> | null {
  const halves = address.split('::');
  if (halves.length > 2) return null;

  const expandGroup = (group: string): Array<number> => {
    if (isIP(group) === 4) {
      const [a, b, c, d] = group.split('.').map((octet) => Number.parseInt(octet, 10));
      return [(a << 8) | b, (c << 8) | d];
    }
    const value = Number.parseInt(group, 16);
    return Number.isNaN(value) ? [] : [value];
  };

  const left = (halves[0] ?? '')
    .split(':')
    .filter(Boolean)
    .flatMap((g) => expandGroup(g));
  const right = (halves[1] ?? '')
    .split(':')
    .filter(Boolean)
    .flatMap((g) => expandGroup(g));

  if (halves.length === 2) {
    const missing = 8 - left.length - right.length;
    if (missing < 1) return null;
    return [...left, ...Array.from<number>({ length: missing }).fill(0), ...right];
  }

  return left.length === 8 ? left : null;
}

function isPrivateIpv6(address: string): boolean {
  const lower = address.toLowerCase();

  if (lower === '::1' || lower === '::') return true;

  const groups = expandIpv6(lower);
  if (!groups) return true;

  const [g0, g1, g2, g3, g4, g5, g6, g7] = groups;

  if ((g0 & 0xfe_00) === 0xfc_00) return true;
  if ((g0 & 0xff_c0) === 0xfe_80) return true;
  if ((g0 & 0xff_c0) === 0xfe_c0) return true;
  if ((g0 & 0xff_00) === 0xff_00) return true;
  if (g0 === 0x20_02) return true;
  if (g0 === 0x20_01 && g1 === 0x0d_b8) return true;
  if (g0 === 0x00_64 && g1 === 0xff_9b) return true;

  if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0xff_ff) {
    const ipv4 = `${String(g6 >> 8)}.${String(g6 & 0xff)}.${String(g7 >> 8)}.${String(g7 & 0xff)}`;
    return isPrivateAddress(ipv4);
  }

  return false;
}

export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) return true;
  if (family === 4) return PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(address));
  return isPrivateIpv6(address);
}

export function isPrivateBaseUrlAllowed(): boolean {
  if (process.env.LLM_ALLOW_PRIVATE_BASE_URL !== 'true') return false;
  if (process.env.NODE_ENV === 'production') {
    logger.error(
      'LLM_ALLOW_PRIVATE_BASE_URL=true is ignored in production. ' +
        'Configure a public endpoint or run a development environment.',
    );
    return false;
  }
  return true;
}

export async function resolveSafeBaseUrl(raw: string, allowPrivate: boolean): Promise<SafeBaseUrl> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new BadRequestException('Base URL is not a valid URL.');
  }

  if (url.username || url.password) {
    throw new BadRequestException('Base URL must not contain credentials.');
  }

  const baseURL = url.toString().replace(/\/$/, '');

  if (allowPrivate) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new BadRequestException('Base URL must use http or https.');
    }
    logger.warn(`SSRF protection disabled for custom base URL: ${url.hostname}`);
    return { baseURL, resolvedIps: [] };
  }

  if (url.protocol !== 'https:') {
    throw new BadRequestException('Base URL must use https.');
  }

  const host = url.hostname.replaceAll(/^\[|\]$/g, '');

  let resolvedIps: ReadonlyArray<string>;
  if (isIP(host) > 0) {
    resolvedIps = [host];
  } else {
    try {
      const results = await lookup(host, { all: true });
      resolvedIps = results.map((entry) => entry.address);
    } catch {
      throw new BadRequestException('Base URL host cannot be resolved.');
    }
  }

  if (resolvedIps.length === 0) {
    throw new BadRequestException('Base URL host cannot be resolved.');
  }

  if (resolvedIps.some((address) => isPrivateAddress(address))) {
    throw new BadRequestException('Base URL must not point to a private or local address.');
  }

  return { baseURL, resolvedIps };
}

export async function assertSafeBaseUrl(raw: string, allowPrivate: boolean): Promise<string> {
  const { baseURL } = await resolveSafeBaseUrl(raw, allowPrivate);
  return baseURL;
}
