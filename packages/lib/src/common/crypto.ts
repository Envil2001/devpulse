import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import nacl_factory from 'tweetnacl';

const nacl = (nacl_factory as any).default || nacl_factory;

const toBase64 = (arr: Uint8Array): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(arr).toString('base64');
  }
  const binString = Array.from(arr, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
};

const fromBase64 = (base64: string): Uint8Array => {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binString = atob(base64);
  return Uint8Array.from(binString, (char) => char.charCodeAt(0));
};

export async function generateSrpServerKey(_salt: string, _verifier: string) {
  const serverPair = nacl.box.keyPair();

  return {
    pubKey: toBase64(serverPair.publicKey),
    privateKey: toBase64(serverPair.secretKey),
  };
}

export async function verifySrpClientProof(
  _salt: string,
  verifier: string,
  serverPublicKey: string,
  clientPublicKey: string,
  clientProof: string,
): Promise<boolean> {
  try {
    const message = utf8ToBytes(`${clientPublicKey}${serverPublicKey}`);
    const key = fromBase64(verifier);

    const expectedProofBytes = hmac(sha256, key, message);
    const expectedProof = toBase64(expectedProofBytes);

    return clientProof === expectedProof;
  } catch (e) {
    return false;
  }
}
