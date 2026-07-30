import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;
const LEGACY_SALT = 'ezitrans_super_secure_salt_987';

/**
 * Hash a password using bcrypt (new standard)
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plain password with a hashed password (supports both bcrypt and legacy HMAC)
 */
export function comparePassword(password: string, hashed: string): boolean {
  if (
    hashed.startsWith('$2a$') ||
    hashed.startsWith('$2b$') ||
    hashed.startsWith('$2y$')
  ) {
    try {
      return bcrypt.compareSync(password, hashed);
    } catch (e) {
      return false;
    }
  }
  
  // Legacy HMAC-SHA256 comparison
  const legacyHash = crypto.createHmac('sha256', LEGACY_SALT).update(password).digest('hex');
  return legacyHash === hashed;
}

/**
 * Check if the hashed password needs an upgrade to bcrypt (i.e. is legacy SHA256)
 */
export function needsRehash(hashed: string): boolean {
  return !(
    hashed.startsWith('$2a$') ||
    hashed.startsWith('$2b$') ||
    hashed.startsWith('$2y$')
  );
}

/**
 * Generate a random 64-character token
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate Gravatar URL using MD5 hashing of the email
 */
export function getGravatarUrl(email: string): string {
  const cleanEmail = email.trim().toLowerCase();
  const md5 = crypto.createHash('md5').update(cleanEmail).digest('hex');
  return `https://www.gravatar.com/avatar/${md5}?d=mp`;
}
