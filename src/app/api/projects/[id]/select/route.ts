import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { projects, variants, versions } from '@/db/schema';
import { jsonError, readJson, requireUser } from '@/lib/auth';
import { PERSONAS } from '@/lib/personas';
import { loadProjectBundle } from '@/lib/projects';
import { toVersionView } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  variantId: z.string().uuid(),
});

export async function POST(request: Request, { params }: RouteParams) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return jsonError('请先登录', 401);
  }

  const { id: projectId } = await params;
  const parsed = bodySchema.safeParse(await readJson<unknown>(request));

  if (!parsed.success) {
    return jsonError('方案 id 无效');
  }

  const bundle = await loadProjectBundle(projectId, user.id);

  if (!bundle) {
    return jsonError('项目不存在', 404);
  }

  const [variant] = await db
    .select()
    .from(variants)
    .where(and(eq(variants.id, parsed.data.variantId), eq(variants.projectId, projectId)))
    .limit(1);

  if (!variant) {
    return jsonError('方案不存在', 404);
  }

  await db
    .update(projects)
    .set({ selectedVariantId: variant.id, updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  const latestVersion = bundle.versions.at(-1);

  if (latestVersion?.variantId === variant.id) {
    return Response.json({ version: toVersionView(latestVersion), created: false });
  }

  const persona = PERSONAS.find((item) => item.id === variant.persona);
  const nextIndex = bundle.versions.length + 1;
  const [version] = await db
    .insert(versions)
    .values({
      projectId,
      variantId: variant.id,
      parentVersionId: latestVersion?.id ?? null,
      prompt: bundle.project.prompt,
      title: `v${nextIndex} · 选择${persona?.name ?? '方案'}`,
      html: variant.html,
    })
    .returning();

  return Response.json({
    version: version ? toVersionView(version) : null,
    created: true,
  });
}
