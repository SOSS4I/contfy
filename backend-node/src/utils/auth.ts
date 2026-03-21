import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

function getJwtSecret(): string {
  if (JWT_SECRET) return JWT_SECRET;
  console.warn('[SECURITY] JWT_SECRET not set, using development fallback. DO NOT use in production!');
  return 'dev-only-secret-change-me';
}

const SALT_ROUNDS = 10;

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(payload: { id: number; email: string; role: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

// Generate unique 6-digit code
export function generateUniqueCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
