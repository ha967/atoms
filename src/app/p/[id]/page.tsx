import { notFound, redirect } from 'next/navigation';
import { Workspace } from '@/components/Workspace';
import { getCurrentUser } from '@/lib/auth';
import { getLlmConfig } from '@/lib/llm';
import { loadProjectBundle } from '@/lib/projects';
import { toProjectView, toVariantView, toVersionView } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autorun?: string; lanes?: string }>;
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/app');
  }

  const { id } = await params;
  const bundle = await loadProjectBundle(id, user.id);

  if (!bundle) {
    notFound();
  }

  const { autorun, lanes } = await searchParams;
  const lanesCount = lanes === '2' ? 2 : 3;
  const latestRunId = bundle.runs[0]?.id;
  const visibleVariants = latestRunId
    ? bundle.variants.filter((variant) => variant.runId === latestRunId)
    : bundle.variants;

  return (
    <Workspace
      initial={{
        project: toProjectView(bundle.project),
        variants: visibleVariants.map(toVariantView),
        versions: bundle.versions.map(toVersionView),
        mockMode: getLlmConfig().mock,
      }}
      autoRun={autorun === '1'}
      initialLanes={lanesCount}
    />
  );
}
