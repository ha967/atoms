import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { jsonError, requireUser } from '@/lib/auth';
import { loadProjectBundle } from '@/lib/projects';
import { toProjectView, toVariantView, toVersionView } from '@/lib/serialize';
import { getLlmConfig } from '@/lib/llm';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return jsonError('请先登录', 401);
  }

  const { id } = await params;
  const bundle = await loadProjectBundle(id, user.id);

  if (!bundle) {
    return jsonError('项目不存在', 404);
  }

  return Response.json({
    project: toProjectView(bundle.project),
    variants: bundle.variants.map(toVariantView),
    versions: bundle.versions.map(toVersionView),
    mockMode: getLlmConfig().mock,
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return jsonError('请先登录', 401);
  }

  const { id } = await params;

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, user.id)));

  return Response.json({ ok: true });
}
