import { argon2idAsync } from '@noble/hashes/argon2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import nacl from 'tweetnacl';

import { computeLoginProof, fromBase64, toBase64 } from '@devpulse/lib';

const ARGON_PARAMS = { m: 65_536, t: 3, p: 1, dkLen: 32 };

const INFO_AUTH = utf8ToBytes('Playmanity-v1-auth');
const INFO_WRAP = utf8ToBytes('Playmanity-v1-wrap');
const EMPTY_SALT = new Uint8Array(0);
const DERIVED_KEY_LENGTH_BYTES = 32;

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const TAG_LENGTH_BYTES = 16;
const SIGNUP_SALT_LENGTH_BYTES = 16;

export interface EncryptedData {
  iv: string;
  ciphertext: string;
  tag: string;
}

interface KeyMaterial {
  authKey: Uint8Array;
  wrapKey: Uint8Array;
}

export const generateKeyPair = () => {
  const pair = nacl.box.keyPair();
  return {
    publicKey: toBase64(pair.publicKey),
    privateKey: toBase64(pair.secretKey),
  };
};

const deriveKeyMaterial = async (password: string, saltBase64: string): Promise<KeyMaterial> => {
  const argonHash = await argon2idAsync(
    utf8ToBytes(password),
    fromBase64(saltBase64),
    ARGON_PARAMS,
  );

  return {
    authKey: hkdf(sha256, argonHash, EMPTY_SALT, INFO_AUTH, DERIVED_KEY_LENGTH_BYTES),
    wrapKey: hkdf(sha256, argonHash, EMPTY_SALT, INFO_WRAP, DERIVED_KEY_LENGTH_BYTES),
  };
};

export class SymmetricCrypto {
  private readonly key: Uint8Array<ArrayBuffer>;
  private cryptoKey: Promise<CryptoKey> | undefined;

  constructor(key?: Uint8Array) {
    if (key && key.length !== KEY_LENGTH_BYTES) {
      throw new Error(`The key must be ${String(KEY_LENGTH_BYTES)} bytes!`);
    }

    // Copying also gives us an ArrayBuffer-backed array, which WebCrypto accepts without casts.
    this.key = key
      ? new Uint8Array(key)
      : globalThis.crypto.getRandomValues(new Uint8Array(KEY_LENGTH_BYTES));
  }

  public getKeyAsBase64(): string {
    return toBase64(this.key);
  }

  public async encrypt(plaintext: string): Promise<EncryptedData> {
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
    const cryptoKey = await this.getCryptoKey();

    const encrypted = new Uint8Array(
      await globalThis.crypto.subtle.encrypt(
        { name: ALGORITHM, iv, tagLength: TAG_LENGTH_BYTES * 8 },
        cryptoKey,
        new TextEncoder().encode(plaintext),
      ),
    );

    // WebCrypto appends the GCM tag to the ciphertext.
    const tagOffset = encrypted.length - TAG_LENGTH_BYTES;

    return {
      iv: toBase64(iv),
      ciphertext: toBase64(encrypted.subarray(0, tagOffset)),
      tag: toBase64(encrypted.subarray(tagOffset)),
    };
  }

  private getCryptoKey(): Promise<CryptoKey> {
    this.cryptoKey ??= globalThis.crypto.subtle.importKey('raw', this.key, ALGORITHM, false, [
      'encrypt',
      'decrypt',
    ]);
    return this.cryptoKey;
  }
}

export const buildSignupCryptoPayload = async (password: string) => {
  const salt = toBase64(
    globalThis.crypto.getRandomValues(new Uint8Array(SIGNUP_SALT_LENGTH_BYTES)),
  );

  const { authKey, wrapKey } = await deriveKeyMaterial(password, salt);

  const { publicKey, privateKey } = generateKeyPair();

  const masterKey = new SymmetricCrypto();
  const encryptedPrivateKeyData = await masterKey.encrypt(privateKey);

  const protectionKey = new SymmetricCrypto(wrapKey);
  const protectedKeyData = await protectionKey.encrypt(masterKey.getKeyAsBase64());

  return {
    salt,
    verifier: toBase64(authKey),
    publicKey,
    encryptedPrivateKey: encryptedPrivateKeyData.ciphertext,
    iv: encryptedPrivateKeyData.iv,
    tag: encryptedPrivateKeyData.tag,
    protectedKey: protectedKeyData.ciphertext,
    protectedKeyIV: protectedKeyData.iv,
    protectedKeyTag: protectedKeyData.tag,
  };
};

export const buildLoginCryptoPayload = async (
  password: string,
  saltBase64: string,
  serverPublicKey: string,
  clientPublicKey: string,
) => {
  const { authKey } = await deriveKeyMaterial(password, saltBase64);

  const proof = computeLoginProof({ authKey, clientPublicKey, serverPublicKey });

  return {
    clientProof: toBase64(proof),
  };
};
