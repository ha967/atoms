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
    <div className="flex min-h-screen justify-center px-6 py-14 sm:py-20">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="btn btn-quiet btn-sm">
            <ArrowLeft size={12} />
            返回首页
          </Link>
        </div>

        <div className="mt-10 border border-rule bg-bg-2/40 p-6">
          <h1 className="display text-[20px]">进入工作台</h1>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            取一个昵称就行。系统会为你开一个独立工作区，项目与版本都保存到数据库。
          </p>
          <div className="mt-6">
            <LoginForm next={safeNext} />
          </div>
        </div>

        <p className="mt-3.5 text-[10.5px] leading-relaxed text-faint">
          这是演示版本，不收集邮箱、密码或任何第三方账号信息。
        </p>
      </div>
    </div>
  );
}
