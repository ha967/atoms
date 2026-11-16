import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, type User } from '@/db/schema';
import { getSessionUserId } from './session';

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
