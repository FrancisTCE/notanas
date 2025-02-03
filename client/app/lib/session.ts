// app/lib/session.ts
export function decrypt(token: string | undefined): any {
  if (!token) return null;

  // Example decryption - adjust according to your actual encryption logic
  const decrypted = Buffer.from(token, 'base64').toString('utf-8');

  // Assuming the decrypted token is in JSON format
  try {
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}
