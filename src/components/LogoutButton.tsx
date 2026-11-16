'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';

export function LogoutButton({ nickname }: { nickname: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-2 sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
          {nickname.slice(0, 1)}
        </span>
        <span className="text-sm text-muted">{nickname}</span>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()} disabled={pending}>
        <LogOut size={13} />
        退出
      </button>
    </div>
  );
}
