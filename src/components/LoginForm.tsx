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
      className="flex w-full flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="nickname" className="label">
          昵称
        </label>
        <input
          id="nickname"
          className="input"
          value={nickname}
          maxLength={20}
          autoFocus
          placeholder="例如：林一"
          onChange={(event) => setNickname(event.target.value)}
        />
        <p className="text-xs leading-relaxed text-muted">
          不需要邮箱和密码。昵称只用于区分你的工作区，数据保存在服务端数据库。
        </p>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        进入工作台
      </button>
    </form>
  );
}
