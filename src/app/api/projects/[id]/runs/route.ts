import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { projects, runs, variants, versions, type Variant } from '@/db/schema';
import { jsonError, readJson, requireUser } from '@/lib/auth';
import { deriveTitle } from '@/lib/html';
import { generateVariant, getLlmConfig, judgeVariants } from '@/lib/llm';
import { generateMockHtml } from '@/lib/mock';
import { getPersonas } from '@/lib/personas';
import { heuristicScore } from '@/lib/score';
import { toVariantView } from '@/lib/serialize';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface RouteParams {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  prompt: z.string().trim().min(4).max(2000).optional(),
  lanes: z.number().int().min(2).max(3).optional(),
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return jsonError('请先登录', 401);
  }

  const { id: projectId } = await params;
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    return jsonError('项目不存在', 404);
  }

  const parsed = bodySchema.safeParse((await readJson<unknown>(request)) ?? {});
  const prompt = parsed.success && parsed.data.prompt ? parsed.data.prompt : project.prompt;
  const lanes = parsed.success && parsed.data.lanes ? parsed.data.lanes : 3;
  const personas = getPersonas(lanes);
  const config = getLlmConfig();
  const source: 'mock' | 'llm' = config.mock ? 'mock' : 'llm';

  if (prompt !== project.prompt) {
    await db
      .update(projects)
      .set({ prompt, title: deriveTitle(prompt), updatedAt: new Date() })
      .where(eq(projects.id, projectId));
  }

  const [run] = await db
    .insert(runs)
    .values({ projectId, prompt, status: 'running', source })
    .returning();

  if (!run) {
    return jsonError('创建生成任务失败', 500);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const send = (event: string, data: unknown): void => {
        if (closed) {
          return;
        }

        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      try {
        send('run_start', {
          runId: run.id,
          source,
          personas: personas.map((persona) => ({
            id: persona.id,
            name: persona.name,
            tagline: persona.tagline,
            accent: persona.accent,
          })),
        });

        const results = await Promise.all(
          personas.map(async (persona, index) => {
            try {
              if (source === 'mock') {
                await delay(500 + index * 600);
              }

              const generated =
                source === 'mock'
                  ? {
                      html: generateMockHtml(prompt, persona.id),
                      tokens: null as number | null,
                      latencyMs: 500 + index * 600,
                    }
                  : await generateVariant({ prompt, persona });

              const [variant] = await db
                .insert(variants)
                .values({
                  runId: run.id,
                  projectId,
                  idx: index,
                  persona: persona.id,
                  html: generated.html,
                  latencyMs: generated.latencyMs,
                  tokens: generated.tokens,
                })
                .returning();

              if (variant) {
                send('variant_done', { variant: toVariantView(variant), source });
              }

              return variant ?? null;
            } catch (error) {
              send('variant_failed', {
                idx: index,
                personaId: persona.id,
                personaName: persona.name,
                error: error instanceof Error ? error.message : '生成失败',
              });
              return null;
            }
          }),
        );

        let succeeded = results.filter((item): item is Variant => item !== null);
        let effectiveSource = source;

        if (succeeded.length === 0 && source === 'llm') {
          effectiveSource = 'mock';
          send('fallback', {
            reason: '模型调用失败（可能是额度、网络或接口异常），已自动切换到内置示例继续演示',
          });

          const fallbackResults = await Promise.all(
            personas.map(async (persona, index) => {
              try {
                const [variant] = await db
                  .insert(variants)
                  .values({
                    runId: run.id,
                    projectId,
                    idx: index,
                    persona: persona.id,
                    html: generateMockHtml(prompt, persona.id),
                    latencyMs: 0,
                    tokens: null,
                  })
                  .returning();

                if (variant) {
                  send('variant_done', { variant: toVariantView(variant), source: 'mock', fallback: true });
                }

                return variant ?? null;
              } catch {
                return null;
              }
            }),
          );

          succeeded = fallbackResults.filter((item): item is Variant => item !== null);
        }

        if (succeeded.length === 0) {
          await db
            .update(runs)
            .set({ status: 'failed', error: '所有方案都生成失败', completedAt: new Date() })
            .where(eq(runs.id, run.id));
          send('run_failed', { runId: run.id, error: '所有方案都生成失败，请重试或切换到演示模式' });
          controller.close();
          return;
        }

        send('judge_start', { count: succeeded.length });

        let judged: Awaited<ReturnType<typeof judgeVariants>> | null = null;

        if (effectiveSource === 'llm') {
          try {
            judged = await judgeVariants({
              prompt,
              variants: succeeded.map((variant) => ({
                id: variant.id,
                persona: variant.persona,
                html: variant.html,
              })),
            });
          } catch {
            judged = null;
          }
        }

        const scores: Array<{ id: string; score: number; reasoning: string }> = [];

        for (const variant of succeeded) {
          const fallback = heuristicScore({ prompt, html: variant.html, personaId: variant.persona });
          const picked = judged?.get(variant.id);
          const score = picked?.score ?? fallback.score;
          const reasoning = picked?.reasoning ?? fallback.reasoning;

          await db.update(variants).set({ score, reasoning }).where(eq(variants.id, variant.id));
          scores.push({ id: variant.id, score, reasoning });
        }

        send('judge_done', { scores });

        const best = [...succeeded].sort((left, right) => {
          const leftScore = scores.find((item) => item.id === left.id)?.score ?? 0;
          const rightScore = scores.find((item) => item.id === right.id)?.score ?? 0;
          return rightScore - leftScore;
        })[0];

        if (!best) {
          throw new Error('没能选出最佳方案');
        }

        await db
          .update(projects)
          .set({ selectedVariantId: best.id, updatedAt: new Date() })
          .where(eq(projects.id, projectId));

        const [versionCountRow] = await db
          .select({ count: sql<string>`count(*)` })
          .from(versions)
          .where(eq(versions.projectId, projectId));
        const nextVersionIndex = Number(versionCountRow?.count ?? 0) + 1;

        const [version] = await db
          .insert(versions)
          .values({
            projectId,
            variantId: best.id,
            prompt,
            html: best.html,
            title: `v${nextVersionIndex} · 最佳方案`,
          })
          .returning();

        await db
          .update(runs)
          .set({ status: 'done', completedAt: new Date(), source: effectiveSource })
          .where(eq(runs.id, run.id));

        send('run_done', {
          runId: run.id,
          bestVariantId: best.id,
          versionId: version?.id ?? null,
          source: effectiveSource,
        });
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : '生成失败';

        await db
          .update(runs)
          .set({ status: 'failed', error: message, completedAt: new Date() })
          .where(eq(runs.id, run.id))
          .catch(() => undefined);

        send('run_failed', { runId: run.id, error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
