# Project Instructions: Atoms Demo

一句话需求 → 多路智能体并行生成单文件 HTML → iframe 直接运行 → 落库 / 迭代 / 分享 / 导出。

## ⚠️ Next.js 版本提醒

本仓库用的是 **Next.js 16.4.6（App Router + Turbopack）**，与训练数据里的常见版本有 breaking change。
写任何 Next.js 代码前，先读 `node_modules/next/dist/docs/` 里对应指南。`AGENTS.md` 由 `next dev` 自动写入，
不要删除，与本文件一起保留即可。

## 技术栈

Next.js 16（App Router）· React 19 · TypeScript strict · Tailwind CSS 4（无组件库，样式集中在 `src/app/globals.css`）
· PostgreSQL + Drizzle ORM · 原生 `fetch` 调 OpenAI 兼容协议 · SSE 流式 · zod 校验。

## 代码风格

- 每条语句/表达式结尾加分号，字符串用单引号，2 空格缩进（遵循用户全局规范）。
- 组件与类型 PascalCase，函数/变量 camelCase，常量 UPPER_SNAKE_CASE。
- 路径别名 `@/*` → `src/*`（`import { db } from '@/db'`）。
- 接口成员、对象字面量分隔符用分号。

## 关键约定

- **服务端页面末尾加 `export const dynamic = 'force-dynamic';`**；长任务 Route Handler 加 `export const maxDuration = 300;`。
- **鉴权**：`requireUser()` 拿当前用户（失败抛错），每个受保护 Route Handler 用 `try/catch` 包住并 `jsonError('请先登录', 401)`。会话用 HMAC 签名 httpOnly Cookie（`src/lib/session.ts`）。
- **入参校验**：所有 POST body 用 `zod.safeParse(await readJson(request))`，失败返回中文 `jsonError`。
- **数据访问**：Drizzle 查询直接写在 Route Handler / Server Component，无 repository 层。聚合查询见 `src/lib/projects.ts`（`loadProjectBundle` / `pickActiveHtml`）。
- **视图序列化**：DB 行不能直接回前端，用 `src/lib/serialize.ts` 的 `toProjectView/toVariantView/toVersionView`。
- **模型调用**：`src/lib/llm.ts` 的 `generateVariant` / `judgeVariants`；无 Key 或 `LLM_MODE=mock` 时 `getLlmConfig().mock === true`，走 `src/lib/mock.ts` 内置示例。真实调用失败要能降级，别让流程中断。
- **流式赛马**：`src/app/api/projects/[id]/runs/route.ts` 用 `ReadableStream` 手写 SSE，事件：`run_start / variant_done / variant_failed / fallback / judge_start / judge_done / run_done / run_failed`。前端在 `src/components/Workspace.tsx` 里按 `\n\n` 分帧解析。
- **预览沙箱**：`iframe` 用 `sandbox="allow-scripts allow-forms ..."`（**不加** `allow-same-origin`），预览前用 `preparePreviewHtml()` 注入内存版 localStorage shim。
- 数据模型：`users → projects → runs → variants`，`versions` 记录每条可回看的产物（见 `src/db/schema.ts`）。

## 数据模型速记

`projects`（项目）· `runs`（一次赛马批次，status/source/error）· `variants`（每路候选，含 persona/score/reasoning）· `versions`（产物版本，variantId + parentVersionId 形成历史链）。

## 常用命令

- 开发：`npm run dev`
- 建表：`docker compose up -d` 然后 `npm run db:migrate`（改 schema 后 `npm run db:generate` 生成迁移）
- 校验：`npm run typecheck` · `npm run lint` · `npm run build`
- E2E：先 `npm run dev`，另开终端 `npm run test:e2e`（`scripts/e2e.mjs`，用本机 Chrome/Edge，可设 `CHROME_PATH`）
- DB 可视化：`npm run db:studio`

## 目录结构

- `src/app/` 页面：`/` 落地页、`/login`、`/app` 工作台、`/p/[id]` 工作区、`/s/[id]` 公开分享
- `src/app/api/` Route Handler：`auth` · `health` · `projects`（含 `[id]/runs|iterate|select|export`）
- `src/components/` 客户端组件（`Workspace.tsx` 是工作区核心）
- `src/db/` Drizzle 连接与 schema；`src/lib/` 领域逻辑（llm/prompts/personas/mock/preview/projects/session/score/serialize/html）
- `docs/` 中文设计文档；`drizzle/` 迁移；`scripts/e2e.mjs` 冒烟测试

## 测试现状

仓库无单元测试框架。质量门禁靠 `typecheck + lint + build`，行为验证靠 `test:e2e`。新增逻辑若难以 E2E 覆盖，优先补 `scripts/e2e.mjs` 场景，而非引入新框架（除非明确要求）。
