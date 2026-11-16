import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'atoms_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecret(): string {
  return process.env.SESSION_SECRET ?? 'atoms-demo-insecure-dev-secret';
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

function isValidSignature(value: string, signature: string): boolean {
  const expected = sign(value);
  const left = Buffer.from(expected, 'utf8');
  const right = Buffer.from(signature, 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

export async function setSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  const separator = raw.lastIndexOf('.');

  if (separator <= 0) {
    return null;
  }

  const userId = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);

  if (!isValidSignature(userId, signature)) {
    return null;
  }

  return userId;
}
