import { getLlmConfig } from '@/lib/llm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getLlmConfig();

  return Response.json({
    ok: true,
    mockMode: config.mock,
    model: config.mock ? null : config.model,
    time: new Date().toISOString(),
  });
}
