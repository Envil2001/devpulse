import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import nacl from 'tweetnacl';

const CHALLENGE_LENGTH_BYTES = 32;
const LOGIN_PROOF_LABEL = 'DevPulse-v1-login-proof';

export function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(binString);
}

export function fromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binString = atob(base64);
  return Uint8Array.from(binString, (char) => char.codePointAt(0) ?? 0);
}

/**
 * Random one-time challenge for the login handshake.
 * It is a nonce, not a key: no Diffie-Hellman is performed with it.
 */
export function generateLoginChallenge(): string {
  return toBase64(nacl.randomBytes(CHALLENGE_LENGTH_BYTES));
}

export interface LoginProofInput {
  authKey: Uint8Array;
  clientPublicKey: string;
  serverPublicKey: string;
}

/**
 * HMAC over a domain-separated, delimiter-separated message.
 * Used by the client to build the proof and by the server to recompute it.
 */
export function computeLoginProof({
  authKey,
  clientPublicKey,
  serverPublicKey,
}: LoginProofInput): Uint8Array {
  const message = utf8ToBytes(`${LOGIN_PROOF_LABEL}\n${clientPublicKey}\n${serverPublicKey}`);
  return hmac(sha256, authKey, message);
}

export interface VerifyLoginProofInput {
  verifier: string;
  clientPublicKey: string;
  serverPublicKey: string;
  clientProof: string;
}

export function verifyClientLoginProof({
  verifier,
  clientPublicKey,
  serverPublicKey,
  clientProof,
}: VerifyLoginProofInput): boolean {
  const expectedProof = computeLoginProof({
    authKey: fromBase64(verifier),
    clientPublicKey,
    serverPublicKey,
  });

  // Constant-time comparison; returns false on length mismatch.
  return nacl.verify(expectedProof, fromBase64(clientProof));
}
