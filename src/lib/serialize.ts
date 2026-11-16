import type { Project, Variant, Version } from '@/db/schema';
import { PERSONAS } from './personas';

export interface VariantView {
  id: string;
  runId: string;
  idx: number;
  personaId: string;
  personaName: string;
  tagline: string;
  accent: string;
  html: string;
  score: number | null;
  reasoning: string | null;
  latencyMs: number | null;
  tokens: number | null;
  createdAt: string;
}

export interface VersionView {
  id: string;
  variantId: string | null;
  prompt: string;
  html: string;
  title: string | null;
  createdAt: string;
}

export interface ProjectView {
  id: string;
  title: string;
  prompt: string;
  selectedVariantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailView {
  project: ProjectView;
  variants: VariantView[];
  versions: VersionView[];
  mockMode: boolean;
}

export function toVariantView(variant: Variant): VariantView {
  const persona = PERSONAS.find((item) => item.id === variant.persona);

  return {
    id: variant.id,
    runId: variant.runId,
    idx: variant.idx,
    personaId: variant.persona,
    personaName: persona?.name ?? variant.persona,
    tagline: persona?.tagline ?? '',
    accent: persona?.accent ?? '#6366f1',
    html: variant.html,
    score: variant.score,
    reasoning: variant.reasoning,
    latencyMs: variant.latencyMs,
    tokens: variant.tokens,
    createdAt: variant.createdAt.toISOString(),
  };
}

export function toVersionView(version: Version): VersionView {
  return {
    id: version.id,
    variantId: version.variantId,
    prompt: version.prompt,
    html: version.html,
    title: version.title,
    createdAt: version.createdAt.toISOString(),
  };
}

export function toProjectView(project: Project): ProjectView {
  return {
    id: project.id,
    title: project.title,
    prompt: project.prompt,
    selectedVariantId: project.selectedVariantId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
