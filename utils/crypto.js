// utils/crypto.js
// Uses SubtleCrypto for ECDH (P-256) key agreement and AES-GCM for symmetric encryption.

const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Generate an ECDH key pair (P-256) for the current user (ephemeral / persistent as you choose).
 */
export async function generateECDHKeyPair() {
  const kp = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // extractable
    ['deriveKey']
  );
  return kp; // { publicKey, privateKey }
}

/**
 * Export public key to base64 string to share with other users (store in DB or send via server).
 */
export async function exportPublicKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(raw);
}

/**
 * Import remote user's public key (from base64 string)
 */
export async function importPublicKey(base64) {
  const raw = base64ToArrayBuffer(base64);
  return crypto.subtle.importKey('raw', raw, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
}

/**
 * Derive a symmetric AES-GCM key from local privateKey and remote publicKey.
 * The returned key is used for encrypt/decrypt.
 */
export async function deriveSharedKey(privateKey, remotePublicKey) {
  // derive a 256-bit AES-GCM key
  const derivedKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: remotePublicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable (set true if you need to export)
    ['encrypt', 'decrypt']
  );
  return derivedKey;
}

/**
 * Encrypt text (string) with AES-GCM key. Returns { ciphertextBase64, ivBase64 }.
 */
export async function encryptWithKey(aesKey, plainText) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit
  const encoded = enc.encode(plainText);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoded
  );
  return {
    ciphertext: arrayBufferToBase64(cipher),
    iv: arrayBufferToBase64(iv.buffer)
  };
}

/**
 * Decrypt ciphertextBase64 with ivBase64 and AES key
 */
export async function decryptWithKey(aesKey, ciphertextBase64, ivBase64) {
  const cipherBuf = base64ToArrayBuffer(ciphertextBase64);
  const ivBuf = base64ToArrayBuffer(ivBase64);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuf) },
    aesKey,
    cipherBuf
  );
  return dec.decode(plainBuf);
}

/* helpers */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
