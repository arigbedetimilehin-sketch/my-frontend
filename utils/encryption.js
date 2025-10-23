// utils/encryption.js
export async function generateKey(sharedKey) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(sharedKey.padEnd(32, "0"));
  return await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptWithKey(sharedKey, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await generateKey(sharedKey);
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const buffer = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + buffer.length);
  combined.set(iv);
  combined.set(buffer, iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptWithKey(sharedKey, encryptedText) {
  try {
    const data = Uint8Array.from(atob(encryptedText), (c) => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const key = await generateKey(sharedKey);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return "[Encrypted message]";
  }
}
