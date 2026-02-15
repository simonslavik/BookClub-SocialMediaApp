import crypto from 'crypto';

/**
 * Generates a cryptographically secure random invite code (e.g., "aBc12xYz")
 */
export function generateInviteCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(bytes[i] % characters.length);
  }
  return code;
}
