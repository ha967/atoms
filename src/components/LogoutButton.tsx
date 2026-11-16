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
    <div className="flex items-center gap-1">
      <div className="hidden items-baseline gap-2 pr-3 sm:flex">
        <span className="num text-[10px] text-faint">工作区</span>
        <span className="text-[12px] text-muted">{nickname}</span>
      </div>
      <button type="button" className="btn btn-quiet btn-sm" onClick={() => void logout()} disabled={pending}>
        <LogOut size={12} />
        退出
      </button>
    </div>
  );
}
