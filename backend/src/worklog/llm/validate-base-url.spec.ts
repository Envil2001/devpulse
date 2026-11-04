import { describe, expect, it } from '@jest/globals';

import { isPrivateAddress } from './validate-base-url';

describe('isPrivateAddress', () => {
  it.each([
    // IPv4
    ['0.0.0.0', true],
    ['10.0.0.1', true],
    ['100.64.0.1', true],
    ['100.127.255.255', true],
    ['100.128.0.1', false], // за пределами CGNAT
    ['127.0.0.1', true],
    ['169.254.169.254', true],
    ['172.16.0.1', true],
    ['172.31.255.255', true],
    ['172.32.0.1', false], // за пределами 172.16/12
    ['192.168.1.1', true],
    ['224.0.0.1', true],
    ['255.255.255.255', true],
    ['8.8.8.8', false],
    // IPv6
    ['::1', true],
    ['::', true],
    ['fc00::1', true],
    ['fd12:3456::1', true],
    ['fe80::1', true],
    ['fe81::1', true], // ← старая версия пропускала
    ['febf::1', true], // ← старая версия пропускала
    ['fec0::1', true], // ← новая проверка
    ['ff02::1', true],
    ['2002:7f00:1::', true], // 6to4 вокруг 127.0.0.1
    ['2001:db8::1', true],
    ['64:ff9b::7f00:1', true], // NAT64 → 127.0.0.1
    ['::ffff:127.0.0.1', true],
    ['0:0:0:0:0:ffff:7f00:1', true], // ← старая версия пропускала (не compressed)
    ['2606:4700:4700::1111', false], // Cloudflare DNS — публичный
    ['2001:4860:4860::8888', false], // Google DNS
  ])('isPrivateAddress(%s) === %s', (address, expected) => {
    expect(isPrivateAddress(address)).toBe(expected);
  });
});
