import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
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
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-rule px-4">
        <Logo />
        <span className="hidden h-4 w-px bg-rule sm:block" aria-hidden="true" />
        <span className="hidden truncate text-[12.5px] text-muted sm:block">{bundle.project.title}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-[10.5px] text-faint sm:inline">由 Atoms Demo 生成 · 只读</span>
          <Link className="btn btn-ghost btn-sm" href="/">
            我也要做一个
            <ArrowRight size={11} />
          </Link>
        </div>
      </header>

      <div className="min-h-0 flex-1 bg-bg-3">
        {html ? (
          <iframe
            title={`${bundle.project.title} 预览`}
            className="h-full min-h-[calc(100vh-52px)] w-full border-0 bg-white"
            sandbox="allow-scripts allow-forms allow-modals allow-popups"
            srcDoc={preparePreviewHtml(html)}
          />
        ) : (
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-[12.5px] text-muted">这个项目还没有可预览的版本。</p>
          </div>
        )}
      </div>
    </div>
  );
}
