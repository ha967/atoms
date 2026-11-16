import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { projects, versions } from '@/db/schema';
import { jsonError, readJson, requireUser } from '@/lib/auth';
import { generateVariant, getLlmConfig } from '@/lib/llm';
import { applyMockIteration } from '@/lib/mock';
import { PERSONAS } from '@/lib/personas';
import { loadProjectBundle, pickActiveHtml } from '@/lib/projects';
import { toVersionView } from '@/lib/serialize';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface RouteParams {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  instruction: z.string().trim().min(2).max(500),
  baseVersionId: z.string().uuid().optional(),
  baseVariantId: z.string().uuid().optional(),
});

export async function POST(request: Request, { params }: RouteParams) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return jsonError('请先登录', 401);
  }

  const { id: projectId } = await params;
  const bundle = await loadProjectBundle(projectId, user.id);

  if (!bundle) {
    return jsonError('项目不存在', 404);
  }

  const parsed = bodySchema.safeParse(await readJson<unknown>(request));

  if (!parsed.success) {
    return jsonError('修改要求需要 2-500 个字符');
  }

  const baseVersion = parsed.data.baseVersionId
    ? bundle.versions.find((version) => version.id === parsed.data.baseVersionId)
    : undefined;
  const baseVariant = parsed.data.baseVariantId
    ? bundle.variants.find((variant) => variant.id === parsed.data.baseVariantId)
    : undefined;
  const previousHtml = baseVersion?.html ?? baseVariant?.html ?? pickActiveHtml(bundle);

  if (!previousHtml) {
    return jsonError('请先生成一个方案，再继续修改', 400);
  }

  const instruction = parsed.data.instruction;
  const config = getLlmConfig();
  let html: string;

  if (config.mock) {
    html = applyMockIteration(previousHtml, instruction);
  } else {
    const generated = await generateVariant({
      prompt: bundle.project.prompt,
      persona: PERSONAS[1],
      previousHtml,
      instruction,
    });
    html = generated.html;
  }

  const latestVersion = bundle.versions.at(-1);
  const parentVersionId = baseVersion?.id ?? latestVersion?.id ?? null;
  const nextIndex = bundle.versions.length + 1;
  const [version] = await db
    .insert(versions)
    .values({
      projectId,
      parentVersionId,
      prompt: instruction,
      title: `v${nextIndex} · ${instruction.slice(0, 18)}`,
      html,
    })
    .returning();

  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));

  return Response.json({
    version: version ? toVersionView(version) : null,
    source: config.mock ? 'mock' : 'llm',
  });
}
