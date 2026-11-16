import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { projects, variants } from '@/db/schema';
import { jsonError, readJson, requireUser } from '@/lib/auth';
import { deriveTitle } from '@/lib/html';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  prompt: z.string().trim().min(4).max(2000),
});

export async function GET() {
  let user;

  try {
    user = await requireUser();
  } catch {
    return jsonError('请先登录', 401);
  }

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      prompt: projects.prompt,
      updatedAt: projects.updatedAt,
      createdAt: projects.createdAt,
      variantCount: sql<string>`count(${variants.id})`,
      bestScore: sql<string | null>`max(${variants.score})`,
    })
    .from(projects)
    .leftJoin(variants, eq(variants.projectId, projects.id))
    .where(eq(projects.userId, user.id))
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt));

  return Response.json({
    projects: rows.map((row) => ({
      ...row,
      variantCount: Number(row.variantCount ?? 0),
      bestScore: row.bestScore === null ? null : Number(row.bestScore),
    })),
  });
}

export async function POST(request: Request) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return jsonError('请先登录', 401);
  }

  const parsed = createSchema.safeParse(await readJson<unknown>(request));

  if (!parsed.success) {
    return jsonError('需求描述需要 4-2000 个字符');
  }

  const prompt = parsed.data.prompt;

  const [project] = await db
    .insert(projects)
    .values({
      userId: user.id,
      title: deriveTitle(prompt),
      prompt,
    })
    .returning();

  return Response.json({ project }, { status: 201 });
}
