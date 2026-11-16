const SYSTEM_RULES = `你是一名资深前端工程师，负责把一句自然语言需求变成一个可以直接运行的单文件网页应用。

硬性要求：
1. 只输出一个完整的 HTML 文档，从 <!DOCTYPE html> 开始、到 </html> 结束。
2. 所有 CSS 写在 <style> 中，所有 JS 写在 <script> 中，不引用任何外部 JS/CSS 库。
3. 不输出 Markdown 代码块标记，不输出任何解释性文字。
4. 页面必须是中文界面，并且在视觉上像一个可以直接交付的产品，而不是练习 demo。
5. 必须包含真实交互：至少有一个可点击按钮、一个输入控件，以及会产生可见结果的状态变化。
6. 数据用 localStorage 持久化，刷新页面后仍然保留。
7. 响应式布局，手机宽度下不横向滚动；不要引用外部图片，图标用 emoji 或内联 SVG。
8. 保证代码没有语法错误，打开即可使用。`;

export function buildGenerationMessages(input: {
  prompt: string;
  personaHint: string;
  previousHtml?: string | null;
  instruction?: string | null;
}): Array<{ role: 'system' | 'user'; content: string }> {
  const { prompt, personaHint, previousHtml, instruction } = input;

  if (previousHtml && instruction) {
    return [
      { role: 'system', content: SYSTEM_RULES },
      {
        role: 'user',
        content: `下面是当前已经可用的应用完整 HTML。请按照修改要求直接修改它，保留未被要求改变的功能与视觉风格，输出修改后的完整 HTML。

【修改要求】
${instruction}

【当前 HTML】
${previousHtml}`,
      },
    ];
  }

  return [
    { role: 'system', content: SYSTEM_RULES },
    {
      role: 'user',
      content: `【需求】
${prompt}

【这一路的差异化策略】
${personaHint}

请直接输出完整 HTML。`,
    },
  ];
}

export function buildJudgePrompt(input: {
  prompt: string;
  variants: Array<{ id: string; persona: string; html: string }>;
}): string {
  const rows = input.variants
    .map((variant, index) => {
      const snippet = variant.html.slice(0, 7000);
      return `### 方案 ${index + 1}（id=${variant.id}，风格=${variant.persona}）\n${snippet}`;
    })
    .join('\n\n');

  return `你是严格的前端评审。用户需求如下：
${input.prompt}

下面是多个候选实现（HTML 片段可能被截断）：

${rows}

请从需求匹配度、交互完整性、视觉完成度、代码健壮性四个维度综合打分（0-100，允许 40-98 区间），并指出每条最关键的优点和一个可改进点。

只输出 JSON，不要输出其它文字，格式：
{"scores":[{"id":"方案 id","score":88,"reason":"一句话点评"}]}`;
}
