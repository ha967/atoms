import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { preparePreviewHtml } from '@/lib/preview';
import { loadPublicProject, pickActiveHtml } from '@/lib/projects';

export const dynamic = 'force-dynamic';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const bundle = await loadPublicProject(id);

  if (!bundle) {
    notFound();
  }

  const html = pickActiveHtml(bundle);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-4">
        <Logo />
        <span className="hidden truncate text-sm text-muted sm:inline">{bundle.project.title}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-white/[0.03] px-2.5 py-1 text-[11px] text-muted sm:inline-flex">
            <Sparkles size={11} className="text-accent-strong" />
            由 Atoms Demo 生成
          </span>
          <Link className="btn btn-primary btn-sm" href="/">
            我也要做一个
            <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      <div className="min-h-0 flex-1 bg-[#0c0e16]">
        {html ? (
          <iframe
            title={`${bundle.project.title} 预览`}
            className="h-full min-h-[calc(100vh-56px)] w-full border-0 bg-white"
            sandbox="allow-scripts allow-forms allow-modals allow-popups"
            srcDoc={preparePreviewHtml(html)}
          />
        ) : (
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-sm text-muted">这个项目还没有可预览的版本。</p>
          </div>
        )}
      </div>
    </div>
  );
}
