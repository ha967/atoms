import { jsonError, requireUser } from '@/lib/auth';
import { loadProjectBundle, pickActiveHtml } from '@/lib/projects';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  let user;

  try {
    user = await requireUser();
  } catch {
    return jsonError('请先登录', 401);
  }

  const { id } = await params;
  const bundle = await loadProjectBundle(id, user.id);

  if (!bundle) {
    return jsonError('项目不存在', 404);
  }

  const html = pickActiveHtml(bundle);

  if (!html) {
    return jsonError('还没有可导出的内容', 404);
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="atoms-${id}.html"`,
      'Cache-Control': 'no-store',
    },
  });
}
