import { escapeHtml } from './html';

interface Theme {
  bg: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  inputBg: string;
  inputText: string;
  radius: string;
  shadow: string;
}

function getTheme(personaId: string): Theme {
  if (personaId === 'visual') {
    return {
      bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #0f172a 100%)',
      panel: 'rgba(255, 255, 255, 0.09)',
      border: 'rgba(255, 255, 255, 0.18)',
      text: '#f8fafc',
      muted: 'rgba(226, 232, 240, 0.72)',
      accent: '#fbbf24',
      accentSoft: 'rgba(251, 191, 36, 0.18)',
      inputBg: 'rgba(255, 255, 255, 0.14)',
      inputText: '#f8fafc',
      radius: '18px',
      shadow: '0 22px 60px rgba(2, 6, 23, 0.45)',
    };
  }

  if (personaId === 'feature') {
    return {
      bg: '#eef2f7',
      panel: '#ffffff',
      border: '#d8e0ea',
      text: '#0f172a',
      muted: '#52627a',
      accent: '#0d9488',
      accentSoft: '#ccfbf1',
      inputBg: 'rgba(255, 255, 255, 0.9)',
      inputText: '#0f172a',
      radius: '12px',
      shadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
    };
  }

  return {
    bg: '#f8fafc',
    panel: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    muted: '#64748b',
    accent: '#4f46e5',
    accentSoft: '#eef2ff',
    inputBg: 'rgba(255, 255, 255, 0.9)',
    inputText: '#0f172a',
    radius: '10px',
    shadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
  };
}

function baseCss(theme: Theme): string {
  return `* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; background: ${theme.bg}; color: ${theme.text}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.shell { width: min(1080px, 100%); margin: 0 auto; padding: 32px 20px 56px; }
h1 { font-size: 26px; margin: 0 0 6px; letter-spacing: -0.02em; }
.sub { margin: 0 0 24px; color: ${theme.muted}; font-size: 14px; }
.panel { background: ${theme.panel}; border: 1px solid ${theme.border}; border-radius: ${theme.radius}; box-shadow: ${theme.shadow}; }
button { cursor: pointer; font-family: inherit; }
input, select, textarea { font-family: inherit; font-size: 14px; color: ${theme.inputText}; background: ${theme.inputBg}; border: 1px solid ${theme.border}; border-radius: 10px; padding: 10px 12px; outline: none; }
input:focus, select:focus, textarea:focus { border-color: ${theme.accent}; box-shadow: 0 0 0 3px ${theme.accentSoft}; }
.btn { background: ${theme.accent}; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; transition: transform 0.15s ease, opacity 0.15s ease; }
.btn:hover { transform: translateY(-1px); opacity: 0.92; }
.ghost { background: transparent; border: 1px solid ${theme.border}; color: ${theme.muted}; border-radius: 8px; padding: 6px 10px; font-size: 12px; }
.badge { display: inline-block; font-size: 11px; padding: 3px 8px; border-radius: 999px; background: ${theme.accentSoft}; color: ${theme.accent}; font-weight: 600; }
.empty { color: ${theme.muted}; font-size: 13px; text-align: center; padding: 18px; border: 1px dashed ${theme.border}; border-radius: 10px; }
`;
}

function shell(title: string, subtitle: string, css: string, body: string, script: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body>
<div class="shell">
<h1>${escapeHtml(title)}</h1>
<p class="sub">${escapeHtml(subtitle)}</p>
${body}
</div>
<script>
${script}
</script>
</body>
</html>`;
}

function kanbanMock(personaId: string, promptTitle: string): string {
  const theme = getTheme(personaId);
  const advanced = personaId !== 'minimal';
  const css = `${baseCss(theme)}
.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
.toolbar input { flex: 1 1 220px; }
.board { display: grid; grid-template-columns: repeat(${advanced ? 3 : 1}, minmax(0, 1fr)); gap: 14px; }
@media (max-width: 760px) { .board { grid-template-columns: 1fr; } }
.column { padding: 14px; min-height: 220px; }
.column h2 { font-size: 14px; margin: 0 0 12px; display: flex; justify-content: space-between; color: ${theme.muted}; }
.column h2 span { font-size: 12px; }
.card { background: ${theme.panel}; border: 1px solid ${theme.border}; border-radius: 10px; padding: 12px; margin-bottom: 10px; box-shadow: ${theme.shadow}; }
.card.done .card-title { text-decoration: line-through; opacity: 0.6; }
.card-title { font-size: 14px; font-weight: 600; margin: 0 0 8px; word-break: break-word; }
.card-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card-actions { display: flex; gap: 6px; }
.empty-state { font-size: 13px; color: ${theme.muted}; text-align: center; padding: 18px 8px; }
.drag-over { outline: 2px dashed ${theme.accent}; outline-offset: 2px; }
`;

  const body = `<form class="toolbar" id="addForm">
  <input id="taskInput" placeholder="输入一个任务，回车即可添加" maxlength="60" required />
  <select id="priority">
    <option value="high">高优先级</option>
    <option value="mid" selected>中优先级</option>
    <option value="low">低优先级</option>
  </select>
  <button class="btn" type="submit">添加任务</button>
</form>
<div class="board" id="board"></div>
<p class="sub" id="summary"></p>`;

  const script = `(function () {
  var STORAGE_KEY = 'atoms_mock_kanban_v1';
  var COLUMNS = [
    { id: 'todo', name: '待办' },
    { id: 'doing', name: '进行中' },
    { id: 'done', name: '已完成' }
  ];
  var PRIORITY_LABEL = { high: '高', mid: '中', low: '低' };
  var tasks = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {}
    return [
      { id: 1, title: '梳理需求，确认核心流程', status: 'done', priority: 'high' },
      { id: 2, title: '完成主界面与关键交互', status: 'doing', priority: 'high' },
      { id: 3, title: '补充空状态与移动端适配', status: 'todo', priority: 'mid' }
    ];
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function render() {
    var board = document.getElementById('board');
    board.innerHTML = '';
    COLUMNS.forEach(function (column) {
      var items = tasks.filter(function (task) { return task.status === column.id; });
      var columnEl = document.createElement('section');
      columnEl.className = 'column panel';
      columnEl.dataset.status = column.id;
      columnEl.innerHTML = '<h2>' + column.name + '<span>' + items.length + ' 项</span></h2>';
      if (items.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = '暂无任务';
        columnEl.appendChild(empty);
      }
      items.forEach(function (task) {
        columnEl.appendChild(renderCard(task));
      });
      if (${advanced}) {
        columnEl.addEventListener('dragover', function (event) { event.preventDefault(); columnEl.classList.add('drag-over'); });
        columnEl.addEventListener('dragleave', function () { columnEl.classList.remove('drag-over'); });
        columnEl.addEventListener('drop', function (event) {
          event.preventDefault();
          columnEl.classList.remove('drag-over');
          var id = Number(event.dataTransfer.getData('text/plain'));
          var task = tasks.find(function (item) { return item.id === id; });
          if (task) { task.status = column.id; save(); render(); }
        });
      }
      board.appendChild(columnEl);
    });
    var done = tasks.filter(function (task) { return task.status === 'done'; }).length;
    document.getElementById('summary').textContent = '共 ' + tasks.length + ' 个任务，已完成 ' + done + ' 个，数据已保存在浏览器本地。';
  }

  function renderCard(task) {
    var card = document.createElement('article');
    card.className = 'card' + (task.status === 'done' ? ' done' : '');
    if (${advanced}) card.draggable = true;
    card.addEventListener('dragstart', function (event) { event.dataTransfer.setData('text/plain', String(task.id)); });
    var title = document.createElement('p');
    title.className = 'card-title';
    title.textContent = task.title;
    var meta = document.createElement('div');
    meta.className = 'card-meta';
    var badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = PRIORITY_LABEL[task.priority] + '优先级';
    var actions = document.createElement('div');
    actions.className = 'card-actions';
    var toggle = document.createElement('button');
    toggle.className = 'ghost';
    toggle.textContent = task.status === 'done' ? '恢复' : '完成';
    toggle.addEventListener('click', function () {
      task.status = task.status === 'done' ? 'todo' : 'done';
      save(); render();
    });
    var remove = document.createElement('button');
    remove.className = 'ghost';
    remove.textContent = '删除';
    remove.addEventListener('click', function () {
      tasks = tasks.filter(function (item) { return item.id !== task.id; });
      save(); render();
    });
    actions.appendChild(toggle);
    actions.appendChild(remove);
    meta.appendChild(badge);
    meta.appendChild(actions);
    card.appendChild(title);
    card.appendChild(meta);
    return card;
  }

  document.getElementById('addForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var input = document.getElementById('taskInput');
    var title = input.value.trim();
    if (!title) return;
    tasks.unshift({ id: Date.now(), title: title, status: 'todo', priority: document.getElementById('priority').value });
    input.value = '';
    save(); render();
  });

  render();
})();`;

  return shell(promptTitle || '轻看板', '赛马演示模式 · 数据保存在浏览器本地，可直接操作', css, body, script);
}

function calculatorMock(personaId: string, promptTitle: string): string {
  const theme = getTheme(personaId);
  const advanced = personaId !== 'minimal';
  const css = `${baseCss(theme)}
.grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 860px) { .grid { grid-template-columns: 340px 1fr; } }
.form { padding: 18px; }
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 13px; color: ${theme.muted}; margin-bottom: 6px; }
.field input { width: 100%; }
.result { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
.hero-value { font-size: 40px; font-weight: 700; letter-spacing: -0.03em; color: ${theme.accent}; }
.hero-label { font-size: 13px; color: ${theme.muted}; }
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.metric { background: ${theme.accentSoft}; border-radius: 10px; padding: 12px; }
.metric span { display: block; font-size: 12px; color: ${theme.muted}; margin-bottom: 4px; }
.metric strong { font-size: 18px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 8px 6px; border-bottom: 1px solid ${theme.border}; text-align: right; }
th:first-child, td:first-child { text-align: left; }
.chart { display: flex; align-items: flex-end; gap: 4px; height: 120px; padding-top: 8px; }
.bar { flex: 1; background: ${theme.accent}; border-radius: 4px 4px 0 0; min-height: 4px; opacity: 0.85; }
.hint { font-size: 12px; color: ${theme.muted}; line-height: 1.6; }
`;

  const body = `<div class="grid">
  <form class="form panel" id="calcForm">
    <div class="field"><label for="amount">贷款金额（万元）</label><input id="amount" type="number" min="1" step="1" value="120" /></div>
    <div class="field"><label for="rate">年利率（%）</label><input id="rate" type="number" min="0.1" step="0.05" value="3.85" /></div>
    <div class="field"><label for="years">贷款年限（年）</label><input id="years" type="number" min="1" max="30" step="1" value="20" /></div>
    <div class="field"><label for="prepay">首月提前还款（万元，可选）</label><input id="prepay" type="number" min="0" step="1" value="0" /></div>
    <button class="btn" type="submit" style="width:100%">重新计算</button>
  </form>
  <section class="result panel">
    <div>
      <div class="hero-label">每月月供</div>
      <div class="hero-value" id="monthly">--</div>
    </div>
    <div class="metrics">
      <div class="metric"><span>支付总利息</span><strong id="interest">--</strong></div>
      <div class="metric"><span>还款总额</span><strong id="total">--</strong></div>
      <div class="metric"><span>实际期数</span><strong id="periods">--</strong></div>
    </div>
    ${advanced ? `<div class="chart" id="chart"></div>
    <div style="overflow:auto"><table id="table"><thead><tr><th>期数</th><th>月供</th><th>本金</th><th>利息</th><th>剩余本金</th></tr></thead><tbody></tbody></table></div>` : ''}
    <p class="hint">按等额本息计算。提前还款在首月直接冲减本金，之后按原期限重新摊还。计算结果仅供参考。</p>
  </section>
</div>`;

  const script = `(function () {
  var STORAGE_KEY = 'atoms_mock_calculator_v1';
  var form = document.getElementById('calcForm');

  function format(value) {
    return value.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  }

  function compute() {
    var amount = Number(document.getElementById('amount').value) * 10000;
    var annualRate = Number(document.getElementById('rate').value) / 100;
    var years = Number(document.getElementById('years').value);
    var prepay = Number(document.getElementById('prepay').value) * 10000;
    var periodsTotal = Math.round(years * 12);
    var principal = Math.max(0, amount - prepay);
    var monthlyRate = annualRate / 12;
    var monthly = monthlyRate === 0 ? principal / periodsTotal : principal * monthlyRate * Math.pow(1 + monthlyRate, periodsTotal) / (Math.pow(1 + monthlyRate, periodsTotal) - 1);
    var remaining = principal;
    var totalInterest = 0;
    var rows = [];

    for (var i = 1; i <= periodsTotal; i += 1) {
      var interest = remaining * monthlyRate;
      var principalPart = monthly - interest;
      remaining = Math.max(0, remaining - principalPart);
      totalInterest += interest;
      rows.push({ period: i, monthly: monthly, principal: principalPart, interest: interest, remaining: remaining });
    }

    document.getElementById('monthly').textContent = '¥ ' + format(monthly);
    document.getElementById('interest').textContent = '¥ ' + format(totalInterest);
    document.getElementById('total').textContent = '¥ ' + format(principal + totalInterest);
    document.getElementById('periods').textContent = periodsTotal + ' 期';

    var tbody = document.querySelector('#table tbody');
    if (tbody) {
      tbody.innerHTML = '';
      rows.slice(0, 12).forEach(function (row) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + row.period + '</td><td>' + format(row.monthly) + '</td><td>' + format(row.principal) + '</td><td>' + format(row.interest) + '</td><td>' + format(row.remaining) + '</td>';
        tbody.appendChild(tr);
      });
    }

    var chart = document.getElementById('chart');
    if (chart) {
      chart.innerHTML = '';
      var max = Math.max.apply(null, rows.map(function (row) { return row.interest; }));
      rows.slice(0, 24).forEach(function (row) {
        var bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = Math.max(4, Math.round((row.interest / max) * 110)) + 'px';
        bar.title = '第 ' + row.period + ' 期利息 ' + format(row.interest);
        chart.appendChild(bar);
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      amount: document.getElementById('amount').value,
      rate: document.getElementById('rate').value,
      years: document.getElementById('years').value,
      prepay: document.getElementById('prepay').value
    }));
  }

  try {
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) {
      document.getElementById('amount').value = saved.amount;
      document.getElementById('rate').value = saved.rate;
      document.getElementById('years').value = saved.years;
      document.getElementById('prepay').value = saved.prepay;
    }
  } catch (error) {}

  form.addEventListener('submit', function (event) { event.preventDefault(); compute(); });
  compute();
})();`;

  return shell(promptTitle || '房贷计算器', '赛马演示模式 · 输入参数即可实时计算，选择会被记住', css, body, script);
}

function profileMock(personaId: string, promptTitle: string): string {
  const theme = getTheme(personaId);
  const css = `${baseCss(theme)}
.profile { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 860px) { .profile { grid-template-columns: 320px 1fr; } }
.editor, .preview { padding: 20px; }
.field { margin-bottom: 12px; }
.field label { display: block; font-size: 12px; color: ${theme.muted}; margin-bottom: 6px; }
.field input, .field textarea { width: 100%; }
.avatar { width: 72px; height: 72px; border-radius: 50%; background: ${theme.accentSoft}; color: ${theme.accent}; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; }
.identity { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.identity h2 { margin: 0 0 4px; font-size: 22px; }
.identity p { margin: 0; color: ${theme.muted}; font-size: 14px; }
.skills { display: flex; flex-wrap: wrap; gap: 8px; }
.section { margin-bottom: 18px; }
.section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: ${theme.muted}; margin: 0 0 8px; }
.section p { margin: 0; line-height: 1.8; font-size: 14px; }
.saved { font-size: 12px; color: ${theme.accent}; margin-top: 8px; }
`;

  const body = `<div class="profile">
  <form class="editor panel" id="editor">
    <div class="field"><label>姓名</label><input id="name" value="林一" maxlength="20" /></div>
    <div class="field"><label>职业</label><input id="role" value="产品工程师" maxlength="30" /></div>
    <div class="field"><label>技能（逗号分隔）</label><input id="skills" value="TypeScript, React, 产品设计" /></div>
    <div class="field"><label>一句话介绍</label><textarea id="bio" rows="4">把复杂问题拆成简单可用的产品，喜欢在设计与工程之间来回横跳。</textarea></div>
    <button class="btn" type="submit" style="width:100%">保存并更新预览</button>
    <div class="saved" id="saved"></div>
  </form>
  <section class="preview panel">
    <div class="identity">
      <div class="avatar" id="avatar">林</div>
      <div><h2 id="previewName">林一</h2><p id="previewRole">产品工程师</p></div>
    </div>
    <div class="section"><h3>关于我</h3><p id="previewBio"></p></div>
    <div class="section"><h3>擅长领域</h3><div class="skills" id="previewSkills"></div></div>
    <div class="section"><h3>联系方式</h3><p>hi@example.com · github.com/example</p></div>
  </section>
</div>`;

  const script = `(function () {
  var STORAGE_KEY = 'atoms_mock_profile_v1';
  var editor = document.getElementById('editor');
  var fields = ['name', 'role', 'skills', 'bio'];

  function render(data) {
    document.getElementById('previewName').textContent = data.name || '未命名';
    document.getElementById('previewRole').textContent = data.role || '独立开发者';
    document.getElementById('previewBio').textContent = data.bio || '还没有填写介绍。';
    document.getElementById('avatar').textContent = (data.name || '未').slice(0, 1);
    var container = document.getElementById('previewSkills');
    container.innerHTML = '';
    (data.skills || '').split(',').map(function (item) { return item.trim(); }).filter(Boolean).forEach(function (skill) {
      var tag = document.createElement('span');
      tag.className = 'badge';
      tag.textContent = skill;
      container.appendChild(tag);
    });
  }

  function read() {
    var data = {};
    fields.forEach(function (key) { data[key] = document.getElementById(key).value; });
    return data;
  }

  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (error) {}
  if (saved) {
    fields.forEach(function (key) { if (saved[key]) document.getElementById(key).value = saved[key]; });
  }
  render(saved || read());

  editor.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = read();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render(data);
    document.getElementById('saved').textContent = '已保存到本地，刷新后仍然保留。';
  });
})();`;

  return shell(promptTitle || '个人主页', '赛马演示模式 · 左侧修改，右侧实时预览', css, body, script);
}

export function generateMockHtml(prompt: string, personaId: string): string {
  const normalized = prompt.toLowerCase();

  if (/看板|任务|待办|kanban|todo/.test(normalized)) {
    return kanbanMock(personaId, '项目看板');
  }

  if (/计算|房贷|贷款|利率|calculator/.test(normalized)) {
    return calculatorMock(personaId, '房贷计算器');
  }

  if (/主页|简历|个人|profile|portfolio/.test(normalized)) {
    return profileMock(personaId, '个人主页');
  }

  return kanbanMock(personaId, '轻量任务看板');
}

export function applyMockIteration(html: string, instruction: string): string {
  const banner =
    '<div style="margin:0;padding:12px 18px;background:#eef2ff;color:#3730a3;font:14px/1.6 -apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;border-bottom:1px solid #c7d2fe;">' +
    '演示模式：已收到修改要求「' +
    escapeHtml(instruction.slice(0, 60)) +
    '」，接入模型后将重新生成完整应用。</div>';

  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, `<body$1>${banner}`);
  }

  return html;
}
