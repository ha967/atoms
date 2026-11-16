'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

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
      setError('再多写几个字，至少 4 个字');
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
      className="border border-rule bg-bg-2/40 transition-colors focus-within:border-rule-strong"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex items-center justify-between border-b border-rule-soft px-3.5 py-2">
        <span className="text-[11px] text-faint">新需求</span>
        <span className="flex items-center gap-2 text-[10.5px] text-faint">
          {mockMode ? <span className="tag tag-warn h-[18px] px-1.5 text-[10px]">内置示例</span> : null}
          赛马模式
        </span>
      </div>

      <textarea
        className="w-full resize-none bg-transparent px-3.5 py-3 text-[14px] leading-relaxed text-text outline-none placeholder:text-faint focus-visible:outline-none"
        rows={3}
        value={prompt}
        maxLength={2000}
        placeholder="例如：我要一个带优先级、截止日和拖拽排序的项目看板，支持新增、完成和删除。"
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submit();
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule-soft px-3.5 py-2">
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-faint">路数</span>
          <div className="seg" role="group" aria-label="赛马路数">
            {[2, 3].map((count) => (
              <button
                key={count}
                type="button"
                className="seg-item"
                data-active={lanes === count}
                onClick={() => setLanes(count)}
              >
                {count} 路
              </button>
            ))}
          </div>
          <span className="hidden text-[10.5px] text-faint sm:inline">多一路多一份取舍，也更慢</span>
        </div>

        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : null}
          开始赛马
          {pending ? null : <ArrowRight size={13} />}
        </button>
      </div>

      {error ? <p className="border-t border-rule-soft px-3.5 py-2 text-[11px] text-danger">{error}</p> : null}
    </form>
  );
}
