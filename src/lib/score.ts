interface ScoreInput {
  prompt: string;
  html: string;
  personaId: string;
}

interface ScoreResult {
  score: number;
  reasoning: string;
}

const KEYWORD_GROUPS = [
  ['看板', '任务', '待办', 'kanban', 'todo'],
  ['计算', '房贷', '贷款', 'calculator', '利率'],
  ['主页', '简历', 'profile', 'portfolio', '个人'],
];

export function heuristicScore(input: ScoreInput): ScoreResult {
  const { html, prompt, personaId } = input;
  let score = 58;
  const reasons: string[] = [];

  if (/<(button|input|select|textarea|form)[\s>]/i.test(html)) {
    score += 8;
    reasons.push('具备可操作的控件');
  }

  if (/addEventListener|onclick=/i.test(html)) {
    score += 6;
    reasons.push('绑定了真实交互');
  }

  if (/localStorage/i.test(html)) {
    score += 5;
    reasons.push('包含本地持久化');
  }

  if (/@media/i.test(html)) {
    score += 4;
    reasons.push('适配了移动端');
  }

  if (html.length > 6000) {
    score += 5;
    reasons.push('实现较为完整');
  }

  const lowered = `${prompt} ${html}`.toLowerCase();

  if (KEYWORD_GROUPS.some((group) => group.some((word) => lowered.includes(word.toLowerCase())))) {
    score += 4;
    reasons.push('覆盖了需求关键词');
  }

  if (personaId === 'visual' && /gradient|backdrop-filter|transition|animation/i.test(html)) {
    score += 4;
    reasons.push('视觉表现到位');
  }

  const finalScore = Math.max(45, Math.min(96, score));
  const reasoning = reasons.length > 0 ? reasons.join('，') : '结构完整，可正常运行';

  return { score: finalScore, reasoning: `${reasoning}（规则评分）` };
}
