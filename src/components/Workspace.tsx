'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  MonitorPlay,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Swords,
  TerminalSquare,
  X,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { PERSONAS } from '@/lib/personas';
import { preparePreviewHtml } from '@/lib/preview';
import type { ProjectDetailView, ProjectView, VariantView, VersionView } from '@/lib/serialize';

interface WorkspaceProps {
  initial: ProjectDetailView;
  autoRun: boolean;
  initialLanes: number;
}

interface LaneState {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  status: 'idle' | 'running' | 'done' | 'failed';
  error?: string;
}

interface RunStartEvent {
  runId: string;
  source: 'mock' | 'llm';
  personas: Array<{ id: string; name: string; tagline: string; accent: string }>;
}

interface VariantDoneEvent {
  variant: VariantView;
  source: string;
}

interface VariantFailedEvent {
  personaId: string;
  error: string;
}

interface JudgeDoneEvent {
  scores: Array<{ id: string; score: number; reasoning: string }>;
}

interface RunDoneEvent {
  runId: string;
  bestVariantId: string;
  versionId: string | null;
}

interface RunFailedEvent {
  error: string;
}

function parseSseBlock(raw: string): { event: string; data: string } | null {
  let event = 'message';
  let data = '';

  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data += line.slice(5).trim();
    }
  }

  if (!data) {
    return null;
  }

  return { event, data };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function scoreTone(score: number | null): string {
  if (score === null) {
    return 'text-muted border-border bg-white/[0.03]';
  }

  if (score >= 85) {
    return 'text-success border-success/30 bg-success/10';
  }

  if (score >= 70) {
    return 'text-warning border-warning/30 bg-warning/10';
  }

  return 'text-danger border-danger/30 bg-danger/10';
}

export function Workspace({ initial, autoRun, initialLanes }: WorkspaceProps) {
  const projectId = initial.project.id;
  const [project, setProject] = useState<ProjectView>(initial.project);
  const [variants, setVariants] = useState<VariantView[]>(initial.variants);
  const [versions, setVersions] = useState<VersionView[]>(initial.versions);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(initial.versions.at(-1)?.id ?? null);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(initial.project.selectedVariantId);
  const [lanes, setLanes] = useState<LaneState[]>(() =>
    PERSONAS.slice(0, initialLanes).map((persona) => ({
      id: persona.id,
      name: persona.name,
      tagline: persona.tagline,
      accent: persona.accent,
      status: initial.variants.some((variant) => variant.personaId === persona.id) ? 'done' : 'idle',
    })),
  );
  const [running, setRunning] = useState(false);
  const [judging, setJudging] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [instruction, setInstruction] = useState('');
  const [iterating, setIterating] = useState(false);
  const [iterateError, setIterateError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const runningRef = useRef(false);
  const startedRef = useRef(false);

  const activeVersion = versions.find((version) => version.id === activeVersionId) ?? null;
  const activeVariant = variants.find((variant) => variant.id === activeVariantId) ?? null;
  const previewHtml = activeVersion?.html ?? activeVariant?.html ?? variants[0]?.html ?? null;
  const activeLabel = activeVersion
    ? activeVersion.title ?? '版本'
    : activeVariant
      ? `${activeVariant.personaName}方案`
      : '预览';

  const refreshProject = useCallback(
    async (preferredVersionId?: string | null) => {
      const response = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as ProjectDetailView;
      const latestRunId = data.variants[0]?.runId ?? null;

      setProject(data.project);
      setVersions(data.versions);
      setVariants(latestRunId ? data.variants.filter((variant) => variant.runId === latestRunId) : data.variants);
      setActiveVersionId(preferredVersionId ?? data.versions.at(-1)?.id ?? null);
      setActiveVariantId(preferredVersionId ? null : data.project.selectedVariantId);
    },
    [projectId],
  );

  const startRace = useCallback(
    async (laneCount: number) => {
      if (runningRef.current) {
        return;
      }

      runningRef.current = true;
      setRunning(true);
      setJudging(false);
      setRunError(null);
      setFallbackNotice(null);
      setVariants([]);
      setActiveVersionId(null);
      setActiveVariantId(null);
      setTab('preview');
      setLanes(
        PERSONAS.slice(0, laneCount).map((persona) => ({
          id: persona.id,
          name: persona.name,
          tagline: persona.tagline,
          accent: persona.accent,
          status: 'running',
        })),
      );

      try {
        const response = await fetch(`/api/projects/${projectId}/runs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lanes: laneCount }),
        });

        if (!response.ok || !response.body) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? '启动赛马失败');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const handleEvent = async (event: string, data: unknown) => {
          if (event === 'run_start') {
            const payload = data as RunStartEvent;
            setLanes(
              payload.personas.map((persona) => ({
                id: persona.id,
                name: persona.name,
                tagline: persona.tagline,
                accent: persona.accent,
                status: 'running',
              })),
            );
            return;
          }

          if (event === 'variant_done') {
            const payload = data as VariantDoneEvent;
            setVariants((previous) => [...previous, payload.variant]);
            setLanes((previous) =>
              previous.map((lane) => (lane.id === payload.variant.personaId ? { ...lane, status: 'done' } : lane)),
            );
            setActiveVariantId((previous) => previous ?? payload.variant.id);
            return;
          }

          if (event === 'variant_failed') {
            const payload = data as VariantFailedEvent;
            setLanes((previous) =>
              previous.map((lane) =>
                lane.id === payload.personaId ? { ...lane, status: 'failed', error: payload.error } : lane,
              ),
            );
            return;
          }

          if (event === 'fallback') {
            const payload = data as { reason?: string };
            setFallbackNotice(payload.reason ?? '模型不可用，已切换到内置示例');
            return;
          }

          if (event === 'judge_start') {
            setJudging(true);
            return;
          }

          if (event === 'judge_done') {
            const payload = data as JudgeDoneEvent;
            setVariants((previous) =>
              previous.map((variant) => {
                const hit = payload.scores.find((score) => score.id === variant.id);
                return hit ? { ...variant, score: hit.score, reasoning: hit.reasoning } : variant;
              }),
            );
            setJudging(false);
            return;
          }

          if (event === 'run_done') {
            const payload = data as RunDoneEvent;
            await refreshProject(payload.versionId);
            return;
          }

          if (event === 'run_failed') {
            const payload = data as RunFailedEvent;
            setRunError(payload.error);
            setJudging(false);
          }
        };

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          let separator = buffer.indexOf('\n\n');

          while (separator >= 0) {
            const raw = buffer.slice(0, separator);
            buffer = buffer.slice(separator + 2);
            const parsed = parseSseBlock(raw);

            if (parsed) {
              await handleEvent(parsed.event, JSON.parse(parsed.data));
            }

            separator = buffer.indexOf('\n\n');
          }
        }
      } catch (error) {
        setRunError(error instanceof Error ? error.message : '赛马失败');
      } finally {
        runningRef.current = false;
        setRunning(false);
        setJudging(false);
      }
    },
    [projectId, refreshProject],
  );

  useEffect(() => {
    if (!autoRun || startedRef.current || initial.variants.length > 0) {
      return;
    }

    startedRef.current = true;
    void startRace(initialLanes);
  }, [autoRun, initial.variants.length, initialLanes, startRace]);

  async function iterate() {
    const trimmed = instruction.trim();

    if (trimmed.length < 2 || iterating) {
      return;
    }

    setIterating(true);
    setIterateError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/iterate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: trimmed,
          baseVersionId: activeVersionId ?? undefined,
          baseVariantId: activeVersionId ? undefined : activeVariantId ?? undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { version?: VersionView; error?: string }
        | null;

      if (!response.ok || !data?.version) {
        throw new Error(data?.error ?? '修改失败');
      }

      setVersions((previous) => [...previous, data.version as VersionView]);
      setActiveVersionId(data.version.id);
      setActiveVariantId(null);
      setInstruction('');
      setTab('preview');
    } catch (error) {
      setIterateError(error instanceof Error ? error.message : '修改失败');
    } finally {
      setIterating(false);
    }
  }

  async function selectVariant(variant: VariantView) {
    setActiveVariantId(variant.id);
    setActiveVersionId(null);
    setSelectingId(variant.id);

    try {
      const response = await fetch(`/api/projects/${projectId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: variant.id }),
      });

      if (response.ok) {
        const data = (await response.json()) as { version?: VersionView | null };

        if (data.version) {
          setVersions((previous) =>
            previous.some((version) => version.id === data.version?.id) ? previous : [...previous, data.version as VersionView],
          );
        }
      }
    } finally {
      setSelectingId(null);
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${projectId}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function copyCode() {
    if (!previewHtml) {
      return;
    }

    await navigator.clipboard.writeText(previewHtml);
    setCodeCopied(true);
    window.setTimeout(() => setCodeCopied(false), 1800);
  }

  function openInNewTab() {
    if (!previewHtml) {
      return;
    }

    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-4 px-4">
          <Logo href="/app" />
          <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
            <span className="truncate text-sm text-muted">{project.title}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {initial.mockMode ? (
              <span className="hidden rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning md:inline">
                演示模式
              </span>
            ) : null}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copyShareLink()}>
              {copied ? <Check size={13} /> : <Share2 size={13} />}
              {copied ? '已复制' : '分享'}
            </button>
            <a className="btn btn-ghost btn-sm" href={`/api/projects/${projectId}/export`}>
              <Download size={13} />
              导出
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] gap-4 p-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 xl:h-[calc(100vh-96px)] xl:overflow-y-auto xl:pr-1">
          <section className="panel-strong p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Swords size={15} className="text-accent-strong" />
                  赛马模式
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  多路智能体并行生成，再按需求匹配度打分择优。
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={running}
                onClick={() => void startRace(initialLanes)}
              >
                {running ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {running ? '生成中' : '重新赛马'}
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {lanes.map((lane) => {
                const variant = variants.find((item) => item.personaId === lane.id);
                return (
                  <button
                    key={lane.id}
                    type="button"
                    disabled={!variant || running}
                    onClick={() => variant && void selectVariant(variant)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      activeVariantId === variant?.id
                        ? 'border-accent/50 bg-accent-soft'
                        : 'border-border bg-white/[0.02] hover:border-border-strong'
                    } ${variant && !running ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                      style={{ background: `${lane.accent}1f`, color: lane.accent }}
                    >
                      {lane.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        {lane.name}
                        {lane.status === 'running' ? (
                          <Loader2 size={11} className="animate-spin text-accent-strong" />
                        ) : null}
                        {lane.status === 'done' ? <Check size={11} className="text-success" /> : null}
                        {lane.status === 'failed' ? <X size={11} className="text-danger" /> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted">
                        {lane.status === 'failed' ? lane.error ?? '生成失败' : variant?.reasoning ?? lane.tagline}
                      </span>
                    </span>
                    {variant?.score !== null && variant?.score !== undefined ? (
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${scoreTone(variant.score)}`}>
                        {variant.score}
                      </span>
                    ) : selectingId === variant?.id ? (
                      <Loader2 size={12} className="animate-spin text-muted" />
                    ) : null}
                  </button>
                );
              })}
              {running && variants.length === 0 ? (
                <div className="flex flex-col gap-2 pt-1">
                  <div className="skeleton h-3 w-2/3" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ) : null}
            </div>

            {judging ? (
              <p className="mt-3 flex items-center gap-2 text-[11px] text-muted">
                <Loader2 size={12} className="animate-spin" />
                评审模型正在对比方案…
              </p>
            ) : null}

            {fallbackNotice ? (
              <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] leading-relaxed text-warning">
                {fallbackNotice}
              </div>
            ) : null}

            {runError ? (
              <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[11px] leading-relaxed text-danger">
                {runError}
                <button type="button" className="ml-2 underline" onClick={() => void startRace(initialLanes)}>
                  重试
                </button>
              </div>
            ) : null}
          </section>

          <section className="panel-strong p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles size={15} className="text-accent-strong" />
                对话式迭代
              </h2>
              <span className="text-[11px] text-muted">{versions.length} 个版本</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              在结果上继续说「把主色换成蓝色」，会生成一个新版本，原版本保留。
            </p>

            <div className="mt-3 flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
              {versions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted">
                  还没有版本，先跑一次赛马
                </div>
              ) : (
                versions.map((version) => (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => {
                      setActiveVersionId(version.id);
                      setActiveVariantId(null);
                      setTab('preview');
                    }}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${
                      activeVersionId === version.id
                        ? 'border-accent/50 bg-accent-soft text-text'
                        : 'border-border bg-white/[0.02] text-muted hover:border-border-strong hover:text-text'
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-[11px]">{version.title ?? version.prompt}</span>
                    <span className="shrink-0 text-[10px] text-muted">{formatTime(version.createdAt)}</span>
                  </button>
                ))
              )}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <textarea
                className="input textarea min-h-[76px]"
                rows={3}
                maxLength={500}
                value={instruction}
                disabled={!previewHtml || iterating}
                placeholder={previewHtml ? '例如：把主色换成蓝色，并加上截止日期筛选' : '生成一个方案后即可继续修改'}
                onChange={(event) => setInstruction(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    void iterate();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={!previewHtml || iterating || instruction.trim().length < 2}
                onClick={() => void iterate()}
              >
                {iterating ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {iterating ? '正在生成新版本…' : '生成新版本'}
              </button>
              {iterateError ? <p className="text-[11px] text-danger">{iterateError}</p> : null}
            </div>
          </section>

          <section className="panel p-4">
            <h3 className="label">原始需求</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">{project.prompt}</p>
          </section>
        </aside>

        <section className="panel-strong flex min-h-[72vh] flex-col overflow-hidden xl:h-[calc(100vh-96px)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
            <div className="flex rounded-lg border border-border bg-black/20 p-0.5">
              <button
                type="button"
                onClick={() => setTab('preview')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  tab === 'preview' ? 'bg-accent-soft text-accent-strong' : 'text-muted hover:text-text'
                }`}
              >
                <MonitorPlay size={13} />
                预览
              </button>
              <button
                type="button"
                onClick={() => setTab('code')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  tab === 'code' ? 'bg-accent-soft text-accent-strong' : 'text-muted hover:text-text'
                }`}
              >
                <Code2 size={13} />
                代码
              </button>
            </div>
            <span className="truncate text-xs text-muted">{activeLabel}</span>
            <div className="ml-auto flex items-center gap-1.5">
              {tab === 'code' ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copyCode()} disabled={!previewHtml}>
                  {codeCopied ? <Check size={12} /> : <Copy size={12} />}
                  {codeCopied ? '已复制' : '复制'}
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost btn-sm" onClick={openInNewTab} disabled={!previewHtml}>
                <ExternalLink size={12} />
                新窗口
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 bg-[#0c0e16]">
            {previewHtml ? (
              tab === 'preview' ? (
                <iframe
                  title="生成应用预览"
                  className="h-full w-full border-0 bg-white"
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                  srcDoc={preparePreviewHtml(previewHtml)}
                />
              ) : (
                <pre className="h-full w-full overflow-auto p-4 font-mono text-[12px] leading-relaxed text-[#c7d2e8]">
                  <code>{previewHtml}</code>
                </pre>
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                {running ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-text">
                      <Loader2 size={16} className="animate-spin text-accent-strong" />
                      智能体正在生成…
                    </div>
                    <p className="max-w-sm text-xs leading-relaxed text-muted">
                      几路方案会陆续出现在左侧，全部完成后自动进入评审并选出最佳方案。
                    </p>
                    <div className="mt-2 grid w-full max-w-md gap-2">
                      <div className="skeleton h-4 w-full" />
                      <div className="skeleton h-4 w-5/6" />
                      <div className="skeleton h-4 w-2/3" />
                    </div>
                  </>
                ) : (
                  <>
                    <TerminalSquare size={22} className="text-muted" />
                    <p className="text-sm font-medium">还没有生成结果</p>
                    <p className="max-w-sm text-xs leading-relaxed text-muted">
                      在左侧点击「重新赛马」，几路智能体会并行生成可直接运行的应用。
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
