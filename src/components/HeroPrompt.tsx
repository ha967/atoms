'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

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
      setError('再多写几个字，至少 4 个字');
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
    <div className="border border-rule bg-bg-2/40 transition-colors focus-within:border-rule-strong">
      <div className="flex items-center justify-between border-b border-rule-soft px-3.5 py-2">
        <span className="text-[11px] text-faint">需求</span>
        <span className="num text-[10px] text-faint">⌘ / Ctrl + Enter 提交</span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(prompt);
        }}
      >
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="w-full resize-none bg-transparent px-3.5 py-3 text-[14px] leading-relaxed text-text outline-none placeholder:text-faint focus-visible:outline-none"
          placeholder="例如：一个带优先级和拖拽排序的项目看板，能新增、完成和删除任务"
          rows={3}
          maxLength={2000}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit(prompt);
            }
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-t border-rule px-3.5 py-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[11px] text-faint">试试</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="example"
                title={example}
                onClick={() => {
                  setPrompt(example);
                  setError(null);
                }}
              >
                {example.slice(0, 12)}…
              </button>
            ))}
          </div>

          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
            {pending ? <Loader2 size={14} className="animate-spin" /> : null}
            {loggedIn ? '开始生成' : '登录并生成'}
            {pending ? null : <ArrowRight size={13} />}
          </button>
        </div>
      </form>

      {error ? <p className="border-t border-rule-soft px-3.5 py-2 text-[11px] text-danger">{error}</p> : null}
    </div>
  );
}
