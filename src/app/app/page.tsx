import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq, sql } from 'drizzle-orm';
import { ArrowUpRight, FolderOpen, Sparkles } from 'lucide-react';
import { db } from '@/db';
import { projects, variants } from '@/db/schema';
import { Logo } from '@/components/Logo';
import { LogoutButton } from '@/components/LogoutButton';
import { NewProjectForm } from '@/components/NewProjectForm';
import { getCurrentUser } from '@/lib/auth';
import { getLlmConfig } from '@/lib/llm';

export const dynamic = 'force-dynamic';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/app');
  }

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      prompt: projects.prompt,
      updatedAt: projects.updatedAt,
      variantCount: sql<string>`count(${variants.id})`,
      bestScore: sql<string | null>`max(${variants.score})`,
    })
    .from(projects)
    .leftJoin(variants, eq(variants.projectId, projects.id))
    .where(eq(projects.userId, user.id))
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt));

  const config = getLlmConfig();
  const completed = rows.filter((row) => row.bestScore !== null).length;

  return (
    <div className="relative min-h-screen">
      <div className="glow right-[-160px] top-[-160px] h-[300px] w-[420px] bg-[#5b3df5]" />

      <header className="relative z-10 border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Logo href="/app" />
          <LogoutButton nickname={user.nickname} />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20">
        <section className="flex flex-wrap items-end justify-between gap-4 pt-10">
          <div>
            <p className="label">Workspace</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {user.nickname}，今天想造点什么？
            </h1>
            <p className="mt-2 text-sm text-muted">
              共 {rows.length} 个项目 · {completed} 个已有可用方案
              {config.mock ? ' · 当前为演示模式' : ' · 已接入模型'}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-3 py-1.5 text-[11px] text-muted">
            <Sparkles size={12} className="text-accent-strong" />
            赛马模式已开启
          </div>
        </section>

        <section className="mt-6">
          <NewProjectForm mockMode={config.mock} />
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FolderOpen size={15} className="text-accent-strong" />
              我的项目
            </h2>
            <span className="text-[11px] text-muted">按最近更新排序</span>
          </div>

          {rows.length === 0 ? (
            <div className="panel mt-3 flex flex-col items-center gap-2 px-6 py-14 text-center">
              <p className="text-sm font-medium">还没有项目</p>
              <p className="max-w-sm text-xs leading-relaxed text-muted">
                在上面的输入框写一句需求，比如「带优先级和拖拽排序的项目看板」，然后点击「开始赛马」。
              </p>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((row) => (
                <Link
                  key={row.id}
                  href={`/p/${row.id}`}
                  className="panel group flex flex-col p-4 transition hover:border-border-strong hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-1 text-sm font-semibold">{row.title}</h3>
                    <ArrowUpRight
                      size={15}
                      className="shrink-0 text-muted transition group-hover:text-accent-strong"
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-muted">{row.prompt}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted">
                    <span>{row.variantCount} 个方案</span>
                    <div className="flex items-center gap-2">
                      {row.bestScore !== null ? (
                        <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-semibold text-success">
                          最高 {Number(row.bestScore)} 分
                        </span>
                      ) : null}
                      <span>{formatDate(row.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
