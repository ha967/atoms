import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq, sql } from 'drizzle-orm';
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

function scoreTone(score: number): string {
  if (score >= 85) {
    return 'text-success';
  }

  if (score >= 70) {
    return 'text-warning';
  }

  return 'text-danger';
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
    <div className="min-h-screen">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between px-4">
          <Logo href="/app" />
          <LogoutButton nickname={user.nickname} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-14">
        <section className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 pt-9 pb-7">
          <div>
            <h1 className="display text-[24px] sm:text-[27px]">{user.nickname}，今天造点什么？</h1>
            <p className="mt-2 text-[12px] text-muted">
              写一句需求，让 2–3 路智能体并行跑一遍，再由评审挑出一版。
            </p>
          </div>

          <dl className="grid grid-cols-[auto_auto] items-baseline gap-x-5 gap-y-1">
            <dt className="text-[10.5px] text-faint">项目</dt>
            <dd className="num text-right text-[13px]">{rows.length}</dd>
            <dt className="text-[10.5px] text-faint">已有可用方案</dt>
            <dd className="num text-right text-[13px]">{completed}</dd>
            <dt className="text-[10.5px] text-faint">模型</dt>
            <dd className="text-right text-[12px] text-muted">{config.mock ? '内置示例' : '已接入'}</dd>
          </dl>
        </section>

        <NewProjectForm mockMode={config.mock} />

        <section className="mt-11">
          <div className="section-head">
            <h2 className="text-[13px] font-semibold">我的项目</h2>
            <span className="text-[10.5px] text-faint">共 <span className="num">{rows.length}</span> 个</span>
            <span className="ml-auto text-[11px] text-faint">按最近更新排序</span>
          </div>

          {rows.length === 0 ? (
            <div className="border-b border-rule-soft py-14 text-center">
              <p className="text-[13px] font-medium">还没有项目</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted">
                在上面写一句需求，比如「带优先级和拖拽排序的项目看板」，然后点「开始赛马」。
              </p>
            </div>
          ) : (
            <div>
              <div className="hidden grid-cols-[minmax(0,1fr)_84px_92px_104px] gap-x-4 border-b border-rule-soft py-2 text-[10.5px] text-faint sm:grid">
                <span>需求</span>
                <span className="text-right">方案</span>
                <span className="text-right">最高分</span>
                <span className="text-right">更新</span>
              </div>

              {rows.map((row) => (
                <Link
                  key={row.id}
                  href={`/p/${row.id}`}
                  className="flex flex-col gap-1.5 border-b border-rule-soft py-3.5 transition-colors hover:bg-white/[0.035] sm:grid sm:grid-cols-[minmax(0,1fr)_84px_92px_104px] sm:items-center sm:gap-x-4 sm:gap-y-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{row.title}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-faint">{row.prompt}</span>
                  </span>
                  <span className="flex items-baseline gap-3 text-[11px] text-muted sm:contents">
                    <span className="num sm:text-right">{row.variantCount} 个方案</span>
                    <span className="sm:text-right">
                      {row.bestScore !== null ? (
                        <span className={`num text-[12.5px] ${scoreTone(Number(row.bestScore))}`}>
                          {Number(row.bestScore)}
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-faint">未评审</span>
                      )}
                    </span>
                    <span className="num text-faint sm:text-right">{formatDate(row.updatedAt)}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-1 px-4 py-5 text-[10.5px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>Atoms Demo · 项目与版本保存在服务端</span>
          <span className="num">Next.js 16 · Drizzle · PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}
