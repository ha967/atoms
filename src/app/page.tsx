import Link from 'next/link';
import {
  ArrowRight,
  Code2,
  Database,
  GitBranch,
  Layers,
  MonitorPlay,
  Share2,
  ShieldCheck,
  Swords,
  Wand2,
} from 'lucide-react';
import { HeroPrompt } from '@/components/HeroPrompt';
import { Logo } from '@/components/Logo';
import { getCurrentUser } from '@/lib/auth';
import { PERSONAS } from '@/lib/personas';

export const dynamic = 'force-dynamic';

const STEPS = [
  { icon: Wand2, title: '一句话需求', description: '用自然语言描述你想要的页面' },
  { icon: Swords, title: '多路并行生成', description: '2-3 个智能体同时动手，风格各异' },
  { icon: MonitorPlay, title: '真实运行预览', description: '生成物在 iframe 里直接可点可用' },
  { icon: GitBranch, title: '迭代与沉淀', description: '继续对话修改，版本与数据都留存' },
];

const CAPABILITIES = [
  { icon: Code2, title: '生成即可运行', description: '单文件 HTML 产物，自带样式与交互，导出后双击即可打开。' },
  { icon: Database, title: '数据持久化', description: '项目、方案、版本全部落在 PostgreSQL，刷新或重开浏览器都还在。' },
  { icon: SparkIcon, title: '赛马模式', description: '多路并行生成后由评审模型打分，也可以手动选择你更喜欢的方案。' },
  { icon: Layers, title: '对话式迭代', description: '在结果上继续提修改要求，每次生成一个新版本，历史可回看。' },
  { icon: Share2, title: '分享与导出', description: '一键复制只读分享链接，或把生成结果导出为独立 HTML 文件。' },
  { icon: ShieldCheck, title: '演示模式兜底', description: '没有 API Key 或断网时，内置示例仍可跑完整流程，演示不中断。' },
];

function SparkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}

export default async function HomePage() {
  let loggedIn = false;

  try {
    loggedIn = Boolean(await getCurrentUser());
  } catch {
    loggedIn = false;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="glow left-1/2 top-[-180px] h-[380px] w-[720px] -translate-x-1/2 bg-[#5b3df5]" />
      <div className="glow right-[-120px] top-[320px] h-[240px] w-[240px] bg-[#0ea5e9]" />
      <div className="glow bottom-[-160px] left-[-120px] h-[260px] w-[320px] bg-[#a855f7]" />

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <a className="btn btn-ghost btn-sm hidden sm:inline-flex" href="/api/health" target="_blank" rel="noreferrer">
            运行状态
          </a>
          <Link className="btn btn-ghost btn-sm" href={loggedIn ? '/app' : '/login'}>
            {loggedIn ? '进入工作台' : '登录'}
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="relative mx-auto flex max-w-3xl flex-col items-center pt-16 text-center sm:pt-24">
          <div className="grid-noise absolute inset-0 -z-10" />
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.04] px-3 py-1.5 text-[11px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
            Atoms Demo · 多智能体应用生成器
          </span>
          <h1 className="mt-6 text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[56px]">
            把一句话，变成
            <br />
            <span className="bg-gradient-to-r from-[#b4a2ff] via-[#8b6dff] to-[#5eead4] bg-clip-text text-transparent">
              能跑的应用
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            输入需求，2-3 路智能体并行生成，评审择优后在页面里直接运行。不满意就继续对话修改，
            结果会被保存、可以分享、也可以整份导出。
          </p>

          <div className="mt-9 w-full">
            <HeroPrompt loggedIn={loggedIn} />
          </div>
          <p className="mt-3 text-[11px] text-muted">
            不需要配置 API Key 也能完整演示 · 服务端持久化 · 生成物可独立运行
          </p>
        </section>

        <section className="mt-24">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="panel relative p-5">
                  <span className="text-[11px] font-mono text-muted">0{index + 1}</span>
                  <Icon size={18} className="mt-3 text-accent-strong" />
                  <h2 className="mt-3 text-sm font-semibold">{step.title}</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight">赛马模式：让好方案自己跑出来</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              同一个需求交给三种不同取向的智能体：极简、功能完整、视觉优先。它们并行工作，
              最后由评审模型按需求匹配度打分，你只需要挑一个顺眼的继续改。
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {PERSONAS.map((persona) => (
              <div key={persona.id} className="panel p-5">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
                  style={{ background: `${persona.accent}1f`, color: persona.accent }}
                >
                  {persona.name.slice(0, 1)}
                </span>
                <h3 className="mt-4 text-sm font-semibold">{persona.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{persona.tagline}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="panel p-5">
                  <Icon size={17} className="text-accent-strong" />
                  <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel-strong mt-20 flex flex-col items-center gap-4 px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">从一个具体的小需求开始</h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted">
            需求越具体，生成质量越稳定。试试「带优先级和拖拽排序的项目看板」，或者「能对比提前还款的房贷计算器」。
          </p>
          <Link className="btn btn-primary" href={loggedIn ? '/app' : '/login'}>
            <Wand2 size={16} />
            {loggedIn ? '进入工作台' : '免费开始'}
          </Link>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>Atoms Demo · 用多智能体把想法变成可运行的原型</span>
          <span className="font-mono">Next.js 16 · Drizzle · PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}
