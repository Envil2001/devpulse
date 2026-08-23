import { argon2id } from '@noble/hashes/argon2.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { utf8ToBytes, bytesToHex as toHex } from '@noble/hashes/utils.js';
import nacl from 'tweetnacl';

type WebCryptoBufferSource = Uint8Array & { buffer: ArrayBuffer };

function asBufferSource(arr: Uint8Array): WebCryptoBufferSource {
  return arr as unknown as WebCryptoBufferSource;
}

function b64ToUint8Array(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToB64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

export const generateKeyPair = () => {
  const pair = nacl.box.keyPair();
  return {
    publicKey: uint8ArrayToB64(pair.publicKey),
    privateKey: uint8ArrayToB64(pair.secretKey),
  };
};

export const deriveArgonKey = async ({
  password,
  salt,
  mem = 65536,
  time = 3,
  parallelism = 1,
  hashLen = 32,
}: {
  password: string;
  salt: string;
  mem?: number;
  time?: number;
  parallelism?: number;
  hashLen?: number;
}) => {
  const passwordBytes = utf8ToBytes(password);
  const saltBytes = b64ToUint8Array(salt);

  const hashBytes = argon2id(passwordBytes, saltBytes, {
    t: time,
    m: mem,
    p: parallelism,
    dkLen: hashLen,
  });

  return {
    hashBytes,
    hashBase64: uint8ArrayToB64(hashBytes),
    hashHex: toHex(hashBytes),
  };
};

const INFO_AUTH = utf8ToBytes('Playmanity-v1-auth');
const INFO_WRAP = utf8ToBytes('Playmanity-v1-wrap');

function splitKeyMaterial(argonHashBytes: Uint8Array): {
  authKey: Uint8Array;
  wrapKey: Uint8Array;
} {
  const authKey = hkdf(sha256, argonHashBytes, new Uint8Array(0), INFO_AUTH, 32);
  const wrapKey = hkdf(sha256, argonHashBytes, new Uint8Array(0), INFO_WRAP, 32);
  return { authKey, wrapKey };
}

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const TAG_LENGTH_BYTES = 16;

export interface EncryptedData {
  iv: string;
  ciphertext: string;
  tag: string;
}

export class SymmetricCrypto {
  private readonly key: Uint8Array;

  constructor(key?: Uint8Array) {
    if (key) {
      if (key.length !== KEY_LENGTH_BYTES) {
        throw new Error(`The key must be ${KEY_LENGTH_BYTES} bytes!`);
      }
      this.key = key;
    } else {
      this.key = window.crypto.getRandomValues(new Uint8Array(KEY_LENGTH_BYTES));
    }
  }

  public getKeyAsBase64(): string {
    return uint8ArrayToB64(this.key);
  }

  private async importKey(usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
    return window.crypto.subtle.importKey('raw', asBufferSource(this.key), ALGORITHM, false, [
      usage,
    ]);
  }

  public async encrypt(plaintext: string): Promise<EncryptedData> {
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
    const encodedText = new TextEncoder().encode(plaintext);
    const cryptoKey = await this.importKey('encrypt');

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv: asBufferSource(iv) },
      cryptoKey,
      asBufferSource(encodedText),
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const tag = encryptedBytes.slice(-TAG_LENGTH_BYTES);
    const ciphertext = encryptedBytes.slice(0, -TAG_LENGTH_BYTES);

    return {
      iv: uint8ArrayToB64(iv),
      ciphertext: uint8ArrayToB64(ciphertext),
      tag: uint8ArrayToB64(tag),
    };
  }
}

export const buildSignupCryptoPayload = async (password: string) => {
  const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
  const salt = uint8ArrayToB64(saltBytes);

  const derivedKey = await deriveArgonKey({ password, salt });

  const { authKey, wrapKey } = splitKeyMaterial(derivedKey.hashBytes);

  const verifier = uint8ArrayToB64(authKey);

  const { publicKey, privateKey } = generateKeyPair();

  const masterKey = new SymmetricCrypto();
  const encryptedPrivateKeyData = await masterKey.encrypt(privateKey);

  const protectionKey = new SymmetricCrypto(wrapKey);
  const protectedKeyData = await protectionKey.encrypt(masterKey.getKeyAsBase64());

  return {
    salt,
    verifier,
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
  const derivedKey = await deriveArgonKey({
    password,
    salt: saltBase64,
  });

  const { authKey } = splitKeyMaterial(derivedKey.hashBytes);

  const message = utf8ToBytes(`${clientPublicKey}${serverPublicKey}`);
  const proofBytes = hmac(sha256, authKey, message);
  const clientProof = uint8ArrayToB64(proofBytes);

  return {
    clientProof,
  };
};
