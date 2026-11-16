import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { jsonError, readJson } from '@/lib/auth';
import { setSession } from '@/lib/session';

const bodySchema = z.object({
  nickname: z.string().trim().min(1).max(20),
});

export async function POST(request: Request) {
  const body = await readJson<unknown>(request);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return jsonError('昵称需要 1-20 个字符');
  }

  const nickname = parsed.data.nickname;

  const [user] = await db
    .insert(users)
    .values({ nickname })
    .onConflictDoUpdate({
      target: users.nickname,
      set: { nickname },
    })
    .returning();

  if (!user) {
    return jsonError('登录失败，请重试', 500);
  }

  await setSession(user.id);

  return Response.json({ user: { id: user.id, nickname: user.nickname } });
}
