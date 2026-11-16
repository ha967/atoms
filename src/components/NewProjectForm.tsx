'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Sparkles, Swords } from 'lucide-react';

const EXAMPLES = [
  '我要一个带优先级、截止日和拖拽排序的项目看板',
  '一个能算房贷月供、并对比提前还款的计算器',
  '帮我生成一个排版精良的个人主页，可以编辑资料',
];

export function NewProjectForm({ mockMode }: { mockMode: boolean }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [lanes, setLanes] = useState(3);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pendingPrompt = window.sessionStorage.getItem('atoms_pending_prompt');

    if (!pendingPrompt) {
      return;
    }

    window.sessionStorage.removeItem('atoms_pending_prompt');

    const timer = window.setTimeout(() => {
      setPrompt(pendingPrompt);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  async function submit() {
    const trimmed = prompt.trim();

    if (trimmed.length < 4) {
      setError('再多描述一点，至少 4 个字');
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
      router.push(`/p/${data.project.id}?autorun=1&lanes=${lanes}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '创建项目失败');
      setPending(false);
    }
  }

  return (
    <form
      className="panel-strong flex flex-col gap-4 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">新建应用</h2>
          <p className="mt-1 text-xs text-muted">一句话描述，三路智能体并行生成，再按分数择优。</p>
        </div>
        {mockMode ? (
          <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
            演示模式
          </span>
        ) : null}
      </div>

      <textarea
        className="input textarea"
        rows={4}
        value={prompt}
        maxLength={2000}
        placeholder="例如：我要一个带优先级、截止日和拖拽排序的项目看板，支持新增、完成和删除。"
        onChange={(event) => setPrompt(event.target.value)}
      />

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
            {example.slice(0, 12)}…
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Swords size={14} />
            赛马路数
          </span>
          <div className="flex rounded-lg border border-border bg-black/20 p-0.5">
            {[2, 3].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setLanes(count)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  lanes === count ? 'bg-accent-soft text-accent-strong' : 'text-muted hover:text-text'
                }`}
              >
                {count} 路
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          开始赛马
        </button>
      </div>

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </form>
  );
}
