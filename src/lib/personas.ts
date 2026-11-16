export interface Persona {
  id: string;
  name: string;
  tagline: string;
  accent: string;
  hint: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'minimal',
    name: '极简派',
    tagline: '少即是多，只保留最关键的动作',
    accent: '#6366f1',
    hint: '追求极简：单屏布局、克制的配色、只实现需求里最核心的 1-2 个交互。代码不超过 250 行。',
  },
  {
    id: 'feature',
    name: '功能派',
    tagline: '覆盖完整流程与边界场景',
    accent: '#10b981',
    hint: '追求功能完整：覆盖增删改查、筛选、空状态、数据校验，并用 localStorage 持久化。代码可以更长。',
  },
  {
    id: 'visual',
    name: '视觉派',
    tagline: '第一眼就有设计感',
    accent: '#f59e0b',
    hint: '追求视觉表现：有层次的排版、渐变或玻璃拟态、细腻的过渡动画、移动端自适应。交互仍然必须真实可用。',
  },
];

export function getPersonas(count: number): Persona[] {
  return PERSONAS.slice(0, Math.max(1, Math.min(PERSONAS.length, count)));
}
