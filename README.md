# Atoms Demo

> 一句话需求 → 多路智能体并行生成 → 页面里直接运行 → 继续对话迭代。

一个可运行的 AI 应用生成器原型：输入自然语言，2-3 个不同取向的智能体同时生成单文件 HTML 应用，
自动评分择优后直接在 iframe 中运行；结果保存在 PostgreSQL，可继续迭代、分享与导出。

- **在线体验**：部署后填写（Vercel + Neon）
- **演示模式**：不配置任何 API Key 也能完整走通全流程

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [docs/架构与实现过程.md](docs/架构与实现过程.md) | 完整实现过程、系统架构、数据模型、API 规格、时序、关键细节、验证记录 |
| [docs/实现说明.md](docs/实现说明.md) | 设计取舍、完成度、未做项、后续优先级、3 分钟演示脚本 |
| [docs/目标.md](docs/目标.md) | 题目要求 |
| [docs/避坑.md](docs/避坑.md) | 笔试注意事项与交付检查清单 |

## 核心闭环

```
① 用户输入一句需求
   ↓
② 2-3 路智能体并行生成（极简派 / 功能派 / 视觉派）
   ↓
③ 评审模型按需求匹配度打分，自动选中最高分
   ↓
④ 生成物在 iframe 中直接运行，可点击、可输入、有状态
   ↓
⑤ 结果落库 → 刷新/重开浏览器仍在 → 可继续迭代、分享、导出
```

与题目要求的对应关系：

| 题目要求 | 实现 |
| --- | --- |
| 智能体驱动生成代码/应用 | `src/lib/llm.ts` + `src/lib/prompts.ts`，OpenAI 兼容协议，可切换 DeepSeek / 通义千问 / OpenRouter |
| 生成结果可视化展示 | `iframe srcDoc` 直接运行单文件 HTML，沙箱隔离 |
| 真实交互 | 生成物本身可操作；宿主应用有赛马进度、版本切换、手动选择等真实交互 |
| 数据持久化 | PostgreSQL + Drizzle ORM：用户、项目、生成批次、候选方案、版本全部落库 |
| 基本使用流程 | 昵称登录 → 新建项目 → 赛马生成 → 预览 → 迭代 |
| 延展能力 | 赛马模式（多路并行 + 评分择优）、对话式迭代、版本历史、分享链接、导出 |

## 功能清单

- [x] 昵称即登录（HMAC 签名 httpOnly Cookie，无密码）
- [x] 工作台：项目列表、最近更新、最高分
- [x] 赛马模式：2/3 路并行，SSE 实时推送每一路状态
- [x] 自动评分：LLM 评审，失败或 mock 时降级为规则评分
- [x] 真实预览：生成的 HTML 在沙箱 iframe 中运行
- [x] 手动选择方案 / 查看每个方案的得分与点评
- [x] 对话式迭代：在结果上继续提要求，生成新版本并保留历史
- [x] 数据持久化：刷新页面、重开浏览器数据仍在
- [x] 公开分享页 `/s/[id]`（免登录只读预览）
- [x] 导出单文件 HTML
- [x] 演示模式：无 API Key / 断网时仍可完整演示
- [x] 健康检查 `/api/health`，可判断当前是否为演示模式

## 技术栈

| 层 | 选择 | 说明 |
| --- | --- | --- |
| 框架 | Next.js 16（App Router / Turbopack） | 前后端一体，Route Handler 直接写 SSE |
| UI | React 19 + TypeScript strict + Tailwind CSS 4 | 无额外组件库，样式集中在 `globals.css` |
| 数据 | PostgreSQL + Drizzle ORM | 本地 Docker，线上 Neon，同一套代码 |
| 模型 | OpenAI Chat Completions 兼容协议 | 原生 `fetch`，无 SDK 绑定，换模型只改环境变量 |
| 流式 | Server-Sent Events | 每路生成完成即推送，不用等全部结束 |

## 本地运行

要求：Node.js 20.9+、Docker。

```bash
# 1. 安装依赖
npm install

# 2. 起本地数据库（Postgres 16，端口 5433）
docker compose up -d

# 3. 准备环境变量
cp .env.example .env.local

# 4. 建表
npm run db:migrate

# 5. 启动
npm run dev
```

打开 http://localhost:3000。

> 默认 `LLM_API_KEY` 为空，应用自动进入**演示模式**：内置三套可交互示例（看板 / 房贷计算器 / 个人主页），
> 完整走通赛马、评分、迭代、分享、导出流程，不消耗任何额度。

### 接入真实模型

编辑 `.env.local`：

```bash
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_API_KEY=your-key
LLM_MODEL=deepseek-chat
LLM_JUDGE_MODEL=deepseek-chat
```

重启后访问 `/api/health`，`mockMode` 应为 `false`。

常见端点：

| 服务 | LLM_BASE_URL | LLM_MODEL |
| --- | --- | --- |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` |
| OpenRouter | `https://openrouter.ai/api/v1` | 任意模型 id |

如需强制演示模式，设置 `LLM_MODE=mock`；强制使用真实模型设置 `LLM_MODE=live`。

## 测试

```bash
npm run typecheck   # TypeScript 严格模式
npm run lint        # ESLint
npm run build       # 生产构建

npm run dev         # 另开终端
npm run test:e2e    # 真实浏览器端到端冒烟测试
```

`test:e2e` 使用本机 Chrome 或 Edge（可用 `CHROME_PATH` 指定），覆盖：
登录 → 创建项目 → 赛马生成 → iframe 内真实交互 → 刷新后数据仍在 → 对话式迭代 →
重新赛马版本递增 → 分享页免登录访问 → 未登录重定向 → 浏览器无运行时错误。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | PostgreSQL 连接串，线上建议用 Neon 的 pooled 连接串 |
| `SESSION_SECRET` | 是 | 会话 Cookie 签名密钥，生产必须替换为随机长字符串 |
| `LLM_BASE_URL` | 否 | 默认 `https://api.deepseek.com/v1` |
| `LLM_API_KEY` | 否 | 为空则进入演示模式 |
| `LLM_MODEL` | 否 | 默认 `deepseek-chat` |
| `LLM_JUDGE_MODEL` | 否 | 评审模型，默认与生成模型相同 |
| `LLM_TIMEOUT_MS` | 否 | 单次生成超时，默认 120000 |
| `LLM_MODE` | 否 | `mock` / `live` / 留空自动判断 |

## 部署（Vercel + Neon）

1. **建库**：在 [Neon](https://neon.tech) 创建项目，复制 **Pooled** 连接串（带 `sslmode=require`）。
2. **建表**（本地执行一次）：
   ```bash
   DATABASE_URL="postgres://...neon.tech/neondb?sslmode=require" npm run db:migrate
   ```
3. **导入 Vercel**：新建项目 → 关联 GitHub 仓库 → 在 Environment Variables 中配置
   `DATABASE_URL`、`SESSION_SECRET`、`LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`。
4. **部署**：Build Command 保持默认 `npm run build`，无需额外配置。
5. **验收**：无痕窗口打开线上地址，完整跑一次「登录 → 生成 → 刷新 → 迭代 → 分享」。

说明：

- 生成任务走 Route Handler 流式响应，`maxDuration` 设为 300 秒；Vercel Hobby 计划可满足 2-3 路并行生成。
- 若 `*.vercel.app` 在目标网络不可访问，可平移到 Zeabur / Railway：代码无需改动，只需配置同一组环境变量。
- 数据库连接使用 `prepare: false`，兼容 Neon 的连接池模式。

## 目录结构

```
src/
├── app/
│   ├── page.tsx                     # 落地页
│   ├── login/                       # 昵称登录
│   ├── app/                         # 工作台（项目列表 + 新建）
│   ├── p/[id]/                      # 项目工作区（赛马 / 预览 / 迭代）
│   ├── s/[id]/                      # 公开分享页
│   └── api/
│       ├── auth/                    # 登录 / 退出
│       ├── projects/                # 项目 CRUD
│       └── projects/[id]/
│           ├── runs/                # 赛马（SSE 流式）
│           ├── iterate/             # 对话式迭代
│           ├── select/              # 手动选择方案
│           └── export/              # 导出 HTML
├── components/                      # Workspace / 表单 / Logo 等
├── db/                              # Drizzle 连接与表结构
└── lib/
    ├── llm.ts                       # 模型调用、HTML 抽取、评审
    ├── prompts.ts                   # 生成与评审提示词
    ├── personas.ts                  # 三路智能体设定
    ├── mock.ts                      # 演示模式内置应用
    ├── preview.ts                   # 沙箱预览的 localStorage shim
    ├── projects.ts                  # 项目聚合查询
    ├── session.ts / auth.ts         # 会话与鉴权
    └── score.ts / serialize.ts      # 规则评分 / 视图序列化
```

## 关键设计取舍

- **生成物是单文件 HTML**：模型输出自包含文档，宿主用 `iframe srcdoc` 直接运行。省掉了构建、依赖安装和沙箱进程，
  也保证「导出的 .html 双击能打开」。
- **iframe 沙箱 + localStorage shim**：沙箱不加 `allow-same-origin`，生成代码拿不到宿主的 Cookie/存储；
  浏览器在不透明源下会禁用 `localStorage`，因此预览时注入内存级 shim，保证示例的增删改查照常工作。
  导出成独立文件后使用原生 `localStorage`，刷新仍然保留。
- **SSE 而不是 WebSocket**：赛马是一次性长任务，单向推送足够，Route Handler 原生支持，部署无需额外服务。
- **演示模式是一等公民**：无 Key 时用内置模板走完整流程；真实生成失败、评审失败也都有降级路径。
- **不做**：邮箱/密码体系、多智能体编排框架、团队协作、实时协同编辑。理由见 `docs/实现说明.md`。

## 已知限制

- 登录只做昵称识别，适合演示，不适合生产鉴权。
- 迭代是单路生成，没有做多路赛马；生成任务直接跑在 HTTP 请求中，没有独立任务队列。
- 未做速率限制与内容审核；公开分享页为只读预览。
- 生成质量依赖模型；提示词已约束为单文件、内联资源、必须可交互。

## License

仅用于笔试演示。
