import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HeroPrompt } from '@/components/HeroPrompt';
import { Logo } from '@/components/Logo';
import { getCurrentUser } from '@/lib/auth';
import { PERSONAS } from '@/lib/personas';

export const dynamic = 'force-dynamic';

const STEPS = [
  { title: '写一句需求', description: '自然语言描述你想要的页面，写清要解决什么、有哪些动作。' },
  { title: '多路并行生成', description: '2–3 个取向不同的智能体同时动手，各自交出一份单文件应用。' },
  { title: '评审打分', description: '评审模型按需求匹配度给每份方案打分，最高分自动成为当前版本。' },
  { title: '继续对话', description: '不满意就接着提要求，每次修改都生成新版本，历史全部保留。' },
];

const CAPABILITIES = [
  { title: '生成即可运行', description: '产物是单文件 HTML，自带样式与交互，导出后双击就能打开。' },
  { title: '数据留在服务端', description: '项目、方案、版本存在 PostgreSQL，换浏览器也还在。' },
  { title: '手动改判', description: '评审分只是建议，你也可以点开任意方案把它设为当前版本。' },
  { title: '版本可回看', description: '每次迭代生成一个新版本，随时切回早先那一版对比。' },
  { title: '分享与导出', description: '复制只读分享链接，或把当前版本导出成独立 HTML 文件。' },
  { title: '断网也能演示', description: '没有 API Key 时自动切到内置示例，整条流程照样跑通。' },
];

const LANE_HALLMARKS = ['≤ 250 行', '全流程', '视觉优先'];

export default async function HomePage() {
  let loggedIn = false;

  try {
    loggedIn = Boolean(await getCurrentUser());
  } catch {
    loggedIn = false;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-1">
            <a className="btn btn-quiet btn-sm hidden sm:inline-flex" href="/api/health" target="_blank" rel="noreferrer">
              运行状态
            </a>
            <Link className="btn btn-ghost btn-sm" href={loggedIn ? '/app' : '/login'}>
              {loggedIn ? '进入工作台' : '登录'}
              <ArrowRight size={12} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-6">
        <section className="grid gap-12 pt-12 pb-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16 lg:pt-20 lg:pb-20">
          <div>
            <h1 className="display text-[30px] sm:text-[34px] lg:text-[38px]">
              同一句需求，三个智能体各写一版。
              <br />
              你只挑跑赢的那个。
            </h1>
            <p className="lede mt-5">
              输入一句需求，2–3 路智能体并行生成可直接运行的单文件应用；评审模型按需求匹配度打分，
              你选一个继续改。分数、版本和历史都留在数据库里。
            </p>

            <div className="mt-8">
              <HeroPrompt loggedIn={loggedIn} />
            </div>

            <p className="mt-3 text-[11.5px] text-faint">
              不需要配置 API Key 也能跑完整个流程 · 产物可独立运行 · 单文件无外部依赖
            </p>
          </div>

          <aside className="self-start border border-rule bg-bg-2/40 lg:mt-2">
            <div className="flex items-baseline justify-between border-b border-rule px-4 py-2.5">
              <span className="text-[12px] font-medium">起跑板</span>
              <span className="text-[10.5px] text-faint"><span className="num">3</span> 条赛道</span>
            </div>

            {PERSONAS.map((persona, index) => (
              <div key={persona.id} className="flex gap-3 border-b border-rule-soft px-4 py-3.5">
                <span
                  className="tick-in mt-1 block w-[2px] shrink-0 self-stretch"
                  style={{ background: persona.accent, animationDelay: `${0.1 + index * 0.12}s` }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2.5">
                    <span className="num text-[10px] text-faint">0{index + 1}</span>
                    <span className="text-[12.5px] font-medium">{persona.name}</span>
                    <span className="ml-auto text-[10.5px] text-faint">{LANE_HALLMARKS[index]}</span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{persona.tagline}</p>
                </div>
              </div>
            ))}

            <div className="p-3">
              <div className="paper flex items-center gap-2.5 px-3 py-2.5">
                <span className="checker" aria-hidden="true" />
                <span className="paper-quote text-[11px]">评审按需求匹配度打分，最高分成为当前版本</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="pb-14">
          <div className="section-head">
            <h2 className="text-[13px] font-semibold">流程</h2>
            <span className="text-[10.5px] text-faint">共 <span className="num">4</span> 步</span>
          </div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-b border-rule-soft py-5 sm:pr-8">
                <span className="num text-[10px] text-faint">{index + 1}</span>
                <h3 className="mt-1.5 text-[13px] font-medium">{step.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="pb-14">
          <div className="section-head">
            <h2 className="text-[13px] font-semibold">三位选手</h2>
            <span className="text-[11px] text-faint">同一个需求，三种取舍</span>
          </div>
          <div className="grid lg:grid-cols-3">
            {PERSONAS.map((persona, index) => (
              <div
                key={persona.id}
                className="flex gap-3.5 border-b border-rule-soft py-5 lg:border-r lg:pr-6 lg:last:border-r-0"
              >
                <span className="mt-1 block w-[2px] shrink-0 self-stretch" style={{ background: persona.accent }} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="num text-[10px] text-faint">0{index + 1}</span>
                    <h3 className="text-[13px] font-medium">{persona.name}</h3>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{persona.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-14">
          <div className="section-head">
            <h2 className="text-[13px] font-semibold">能力清单</h2>
            <span className="text-[10.5px] text-faint">共 <span className="num">6</span> 项</span>
          </div>
          <dl className="grid sm:grid-cols-2 sm:gap-x-10">
            {CAPABILITIES.map((item) => (
              <div key={item.title} className="border-b border-rule-soft py-3.5">
                <dt className="text-[12.5px] font-medium">{item.title}</dt>
                <dd className="mt-1 text-[12px] leading-relaxed text-muted">{item.description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="paper mb-16 px-6 py-8 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="display text-[23px] text-ink">需求越具体，生成越稳。</h2>
              <p className="mt-2.5 max-w-[38em] text-[12.5px] leading-[1.8] text-ink-muted">
                试试「带优先级和截止日的项目看板」，或者「能对比提前还款的房贷计算器」——写清动作和结果，
                比写清风格有用得多。
              </p>
            </div>
            <Link className="btn btn-ink" href={loggedIn ? '/app' : '/login'}>
              开一局
              <ArrowRight size={13} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-1.5 px-6 py-5 text-[11px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>Atoms Demo · 多智能体应用生成器</span>
          <span className="num">Next.js 16 · Drizzle · PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}
