import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LoginForm } from '@/components/LoginForm';
import { Logo } from '@/components/Logo';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser().catch(() => null);

  if (user) {
    redirect('/app');
  }

  const { next } = await searchParams;
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="glow left-1/2 top-[-160px] h-[320px] w-[560px] -translate-x-1/2 bg-[#5b3df5]" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <Link href="/" className="flex items-center gap-1 text-xs text-muted transition hover:text-text">
            <ArrowLeft size={13} />
            返回首页
          </Link>
        </div>
        <div className="panel-strong p-6">
          <h1 className="text-xl font-semibold tracking-tight">进入工作台</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            一个昵称就够了。系统会为你创建独立的工作区，项目与版本都保存到数据库。
          </p>
          <div className="mt-6">
            <LoginForm next={safeNext} />
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
          这是笔试演示版本，不收集邮箱、密码或任何第三方账号信息。
        </p>
      </div>
    </div>
  );
}
