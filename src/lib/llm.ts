import { extractHtml } from './html';
import type { Persona } from './personas';
import { buildGenerationMessages, buildJudgePrompt } from './prompts';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  judgeModel: string;
  timeoutMs: number;
  mock: boolean;
}

interface ChatResult {
  content: string;
  tokens: number | null;
}

export interface GeneratedVariant {
  html: string;
  tokens: number | null;
  latencyMs: number;
  source: 'llm';
}

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmError';
  }
}

export function getLlmConfig(): LlmConfig {
  const mode = (process.env.LLM_MODE ?? '').trim().toLowerCase();
  const apiKey = (process.env.LLM_API_KEY ?? '').trim();
  const model = process.env.LLM_MODEL?.trim() || 'deepseek-chat';

  return {
    baseUrl: (process.env.LLM_BASE_URL?.trim() || 'https://api.deepseek.com/v1').replace(/\/+$/, ''),
    apiKey,
    model,
    judgeModel: process.env.LLM_JUDGE_MODEL?.trim() || model,
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 120000),
    mock: mode === 'mock' || (mode !== 'live' && !apiKey),
  };
}

async function chatCompletion(
  messages: ChatMessage[],
  options: { model?: string; temperature?: number; maxTokens?: number },
): Promise<ChatResult> {
  const config = getLlmConfig();

  if (config.mock) {
    throw new LlmError('当前处于演示模式，未调用模型');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model ?? config.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 6000,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new LlmError(`模型接口返回 ${response.status}：${detail}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new LlmError('模型返回了空内容');
    }

    return {
      content,
      tokens: data.usage?.total_tokens ?? null,
    };
  } catch (error) {
    if (error instanceof LlmError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new LlmError(`生成超时（${Math.round(config.timeoutMs / 1000)} 秒）`);
    }

    throw new LlmError(error instanceof Error ? error.message : '调用模型失败');
  } finally {
    clearTimeout(timer);
  }
}

export async function generateVariant(input: {
  prompt: string;
  persona: Persona;
  previousHtml?: string | null;
  instruction?: string | null;
}): Promise<GeneratedVariant> {
  const startedAt = Date.now();
  const messages = buildGenerationMessages({
    prompt: input.prompt,
    personaHint: input.persona.hint,
    previousHtml: input.previousHtml,
    instruction: input.instruction,
  });

  const result = await chatCompletion(messages, {
    temperature: input.persona.id === 'visual' ? 0.9 : 0.65,
    maxTokens: 7000,
  });

  const html = extractHtml(result.content);

  if (!html) {
    throw new LlmError('模型没有返回完整的 HTML 文档');
  }

  return {
    html,
    tokens: result.tokens,
    latencyMs: Date.now() - startedAt,
    source: 'llm',
  };
}

export async function judgeVariants(input: {
  prompt: string;
  variants: Array<{ id: string; persona: string; html: string }>;
}): Promise<Map<string, { score: number; reasoning: string }>> {
  const config = getLlmConfig();

  if (config.mock) {
    throw new LlmError('当前处于演示模式，未调用评审模型');
  }

  const result = await chatCompletion(
    [
      {
        role: 'system',
        content: '你是严格但公正的前端评审，只输出 JSON。',
      },
      { role: 'user', content: buildJudgePrompt(input) },
    ],
    { model: config.judgeModel, temperature: 0.1, maxTokens: 1200 },
  );

  const jsonText = result.content.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonText) {
    throw new LlmError('评审结果不是有效 JSON');
  }

  const parsed = JSON.parse(jsonText) as {
    scores?: Array<{ id?: string; score?: number; reason?: string }>;
  };

  const scores = new Map<string, { score: number; reasoning: string }>();

  for (const item of parsed.scores ?? []) {
    if (!item.id || typeof item.score !== 'number') {
      continue;
    }

    scores.set(item.id, {
      score: Math.max(0, Math.min(100, Math.round(item.score))),
      reasoning: item.reason?.trim() || '评审未给出说明',
    });
  }

  if (scores.size === 0) {
    throw new LlmError('评审结果为空');
  }

  return scores;
}
