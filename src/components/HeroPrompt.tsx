'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

const EXAMPLES = [
  '我要一个带优先级、截止日和拖拽排序的项目看板',
  '一个能算房贷月供、并对比提前还款的计算器',
  '帮我生成一个排版精良的个人主页，可以编辑资料',
];

export function HeroPrompt({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(value: string) {
    const trimmed = value.trim();

    if (trimmed.length < 4) {
      setError('再多描述一点，至少 4 个字');
      return;
    }

    if (!loggedIn) {
      window.sessionStorage.setItem('atoms_pending_prompt', trimmed);
      router.push('/login?next=/app');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '创建项目失败');
      }

      const data = (await response.json()) as { project: { id: string } };
      router.push(`/p/${data.project.id}?autorun=1`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '创建项目失败');
      setPending(false);
    }
  }

  return (
    <div className="panel-strong w-full rounded-2xl p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(prompt);
        }}
      >
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="input textarea border-0 bg-transparent px-4 pt-4 text-[15px] focus:shadow-none"
          placeholder="描述你想要的应用，例如：一个带优先级和拖拽排序的项目看板……"
          rows={3}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit(prompt);
            }
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-3 pt-1">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="chip"
                onClick={() => {
                  setPrompt(example);
                  setError(null);
                }}
              >
                <Sparkles size={12} />
                {example.slice(0, 14)}…
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-muted sm:inline">⌘ + Enter 提交</span>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loggedIn ? '开始生成' : '登录并生成'}
            </button>
          </div>
        </div>
      </form>
      {error ? <p className="px-4 pb-3 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
