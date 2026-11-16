#!/usr/bin/env node
/**
 * 端到端冒烟测试（需要本地 dev server 已启动）
 *
 * 用法：
 *   npm run dev            # 另开一个终端
 *   npm run test:e2e
 *
 * 可选环境变量：
 *   BASE_URL=http://localhost:3000
 *   CHROME_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe
 */
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const ARTIFACT_DIR = '.tmp-test/e2e';
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const executablePath = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));

if (!executablePath) {
  console.error('找不到 Chrome/Edge，请通过 CHROME_PATH 指定可执行文件路径。');
  process.exit(1);
}

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const results = [];
const errors = [];

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!passed) {
    errors.push(name);
  }
}

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') {
    pageErrors.push(message.text());
  }
});

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('落地页可访问', (await page.title()).includes('Atoms Demo'), await page.title());

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#nickname', `E2E-${Date.now()}`);
  await page.click('button:has-text("进入工作台")');
  await page.waitForURL('**/app', { timeout: 15000 });
  check('昵称登录进入工作台', page.url().endsWith('/app'));

  await page.fill('textarea', '我要一个带优先级、截止日和拖拽排序的项目看板');
  await page.click('button:has-text("开始赛马")');
  await page.waitForURL(/\/p\/[0-9a-f-]+\?autorun=1/, { timeout: 15000 });
  const projectId = new URL(page.url()).pathname.split('/')[2];
  check('创建项目并自动开始赛马', Boolean(projectId), projectId);

  await page.waitForSelector('iframe[title="生成应用预览"]', { timeout: 60000 });
  await page.waitForSelector('button:has-text("重新赛马")', { timeout: 60000 });
  await page.waitForTimeout(800);
  check('生成结果在 iframe 中渲染', true);
  await page.screenshot({ path: `${ARTIFACT_DIR}/workspace.png`, fullPage: true });

  const frame = page.frameLocator('iframe[title="生成应用预览"]');
  const storage = await frame.locator('body').evaluate(() => {
    try {
      localStorage.setItem('e2e_probe', 'ok');
      return `ok:${localStorage.getItem('e2e_probe')}`;
    } catch (error) {
      return `fail:${error.name}`;
    }
  });
  check('预览内的 localStorage 可用', storage === 'ok:ok', storage);

  await frame.locator('#taskInput').fill('E2E 新增的任务');
  await frame.locator('button:has-text("添加任务")').click();
  await page.waitForTimeout(300);
  check('生成物真实可交互', (await frame.locator('text=E2E 新增的任务').count()) > 0);

  check('生成版本 v1', (await page.locator('button:has-text("v1 · 最佳方案")').count()) > 0);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('iframe[title="生成应用预览"]', { timeout: 20000 });
  check(
    '刷新后数据仍在',
    (await page.locator('button:has-text("v1 · 最佳方案")').count()) > 0,
  );

  await page.fill('textarea[placeholder^="例如：把主色换成蓝色"]', '把主色调换成蓝色');
  await page.click('button:has-text("生成新版本")');
  await page.waitForSelector('button:has-text("v2 ·")', { timeout: 30000 });
  check('对话式迭代生成 v2', true);

  await page.click('button:has-text("重新赛马")');
  await page.waitForSelector('button:has-text("v3 · 最佳方案")', { timeout: 60000 });
  check('重新赛马版本号递增', true);

  await page.goto(`${BASE}/s/${projectId}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('iframe', { timeout: 15000 });
  check('分享页免登录可预览', (await page.frameLocator('iframe').locator('h1').count()) > 0);
  await page.screenshot({ path: `${ARTIFACT_DIR}/share.png`, fullPage: true });

  const anonymous = await browser.newContext();
  const anonymousPage = await anonymous.newPage();
  await anonymousPage.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  check('未登录访问工作台会跳转登录', anonymousPage.url().includes('/login'), anonymousPage.url());
  await anonymous.close();

  check('浏览器无运行时错误', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
} catch (error) {
  check('测试执行未抛异常', false, error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.passed).length;
console.log(`\n${results.length - failed}/${results.length} 项通过`);
process.exit(failed === 0 ? 0 : 1);
