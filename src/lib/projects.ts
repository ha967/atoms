import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { projects, runs, variants, versions, type Project, type Run, type Variant, type Version } from '@/db/schema';

export interface ProjectBundle {
  project: Project;
  runs: Run[];
  variants: Variant[];
  versions: Version[];
}

export async function loadProjectBundle(projectId: string, userId: string): Promise<ProjectBundle | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return null;
  }

  const [projectRuns, projectVariants, projectVersions] = await Promise.all([
    db.select().from(runs).where(eq(runs.projectId, projectId)).orderBy(desc(runs.createdAt)),
    db.select().from(variants).where(eq(variants.projectId, projectId)).orderBy(desc(variants.createdAt)),
    db.select().from(versions).where(eq(versions.projectId, projectId)).orderBy(asc(versions.createdAt)),
  ]);

  return {
    project,
    runs: projectRuns,
    variants: projectVariants,
    versions: projectVersions,
  };
}

export async function loadPublicProject(projectId: string): Promise<ProjectBundle | null> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

  if (!project) {
    return null;
  }

  const [projectVariants, projectVersions] = await Promise.all([
    db.select().from(variants).where(eq(variants.projectId, projectId)).orderBy(desc(variants.createdAt)),
    db.select().from(versions).where(eq(versions.projectId, projectId)).orderBy(asc(versions.createdAt)),
  ]);

  return {
    project,
    runs: [],
    variants: projectVariants,
    versions: projectVersions,
  };
}

export function pickActiveHtml(bundle: ProjectBundle): string | null {
  const latestVersion = bundle.versions.at(-1);

  if (latestVersion) {
    return latestVersion.html;
  }

  const selected = bundle.variants.find((variant) => variant.id === bundle.project.selectedVariantId);

  if (selected) {
    return selected.html;
  }

  const best = [...bundle.variants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  return best?.html ?? null;
}
