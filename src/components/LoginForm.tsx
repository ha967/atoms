'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = nickname.trim();

    if (!trimmed) {
      setError('先取一个昵称吧');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? '登录失败');
      }

      router.push(next);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败');
      setPending(false);
    }
  }

  return (
    <form
      className="flex w-full flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nickname" className="text-[11px] text-faint">
          昵称
        </label>
        <input
          id="nickname"
          className="field"
          value={nickname}
          maxLength={20}
          autoFocus
          placeholder="例如：林一"
          onChange={(event) => setNickname(event.target.value)}
        />
        <p className="text-[11px] leading-relaxed text-muted">
          不需要邮箱和密码。昵称只用来区分工作区，数据存在服务端数据库。
        </p>
      </div>

      {error ? <p className="text-[11px] text-danger">{error}</p> : null}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : null}
        进入工作台
        {pending ? null : <ArrowRight size={13} />}
      </button>
    </form>
  );
}
