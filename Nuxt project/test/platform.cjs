const { chromium } = require('playwright');
const ts = require('typescript');
const fs = require('node:fs');
const assert = require('node:assert/strict');
// Проверяем публичный тренажёр на статической сборке, без обращения к рабочему серверу.
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}), args: ['--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('http://practice.test/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    let file = require('node:path').join(process.cwd(), '.output/public', pathname === '/' ? 'index.html' : pathname);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = require('node:path').join(file, 'index.html');
    if (!fs.existsSync(file)) return route.fulfill({status:404,body:'Not found'});
    const ext = require('node:path').extname(file);
    await route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'})[ext] || 'application/octet-stream'});
  });
  await page.goto('http://practice.test');
  await page.locator('a[href="/learn"]').first().click();
  await page.locator('#variables-name .cm-content').fill('function solution() { const title = "JavaScript"; return title; }');
  await page.locator('#variables-name').locator('..').locator('button.button-secondary').click();
  await page.locator('#variables-score .cm-content').fill('function solution() { let score = 4; score += 3; return score; }');
  await page.locator('#variables-score').locator('..').locator('button.button-secondary').click();
  await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('practice:javascript:v2')).answers).filter(a=>a.passed).length===2);


  await page.locator('main button[aria-pressed]').nth(1).click();
  await page.locator('.cm-content').fill('function total(price,count) { return price*count; }');
  await page.locator('section button.button-primary').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('practice:javascript:v2')).answers['variables:code']?.passed);
  await page.reload();
  await page.locator('main button[aria-pressed]').first().click();

  await page.locator('#variables-name .cm-content').waitFor();
  assert.match(await page.locator('#variables-name .cm-content').innerText(), /const title/);
  await page.locator('main button[aria-pressed]').nth(1).click();
  assert.match(await page.locator('.cm-content').innerText(), /price\*count/);
  const checker = ts.transpileModule(fs.readFileSync('app/utils/checkCode.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const course = ts.transpileModule(fs.readFileSync('app/data/course.ts', 'utf8').replace("import { taskExamples } from './taskExamples'", fs.readFileSync('app/data/taskExamples.ts', 'utf8').replace('export const taskExamples', 'const taskExamples')), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const checks = await page.evaluate(async ({checker, course}) => {
    const load = async text => { const url = URL.createObjectURL(new Blob([text], {type:'text/javascript'})); try { return await import(url); } finally { URL.revokeObjectURL(url); } };
    const { checkCode } = await load(checker);
    const { lessons } = await load(course);
    const solutions = [
      'function total(price,count){return price*count}',
      'function sumInput(a,b){return Number(a)+Number(b)}',
      'function isEven(n){return n%2===0}',
      'function sign(n){return n>0?"positive":n<0?"negative":"zero"}',
      'function sumTo(n){let s=0;for(let i=1;i<=n;i++)s+=i;return s}',
      'function maxOf(a,b){return a>b?a:b}',
      'function positiveNumbers(numbers){return numbers.filter(n=>n>0)}',
      'function userLabel(user){return user.name.trim()+", "+user.age}',
      'function passedStudents(students){return students.filter(s=>s.score>=60).map(s=>s.name)}',
    ];
    const results = [];
    for (const [i,l] of lessons.entries()) results.push({id:l.id, results:await checkCode(solutions[i],l.task.functionName,l.task.cases)});
    return { results, wrongType: await checkCode('function total(){return "360"}', 'total', [{args:[120,3],expected:360}]), syntax: await checkCode('function {', 'total', []), timeout: await checkCode('function total(){while(true){}}','total',[{args:[],expected:0}]) };
  }, {checker, course});
  for (const item of checks.results) assert.ok(item.results.every(r=>r.passed), JSON.stringify(item));
  assert.ok(!checks.wrongType[0].passed);
  assert.match(checks.syntax[0].label, /SyntaxError/);
  assert.ok(!checks.timeout[0].passed);
  await page.locator('main button[aria-pressed]').first().click();
  await page.screenshot({ path: 'test/desktop.png', fullPage: true });
  await page.setViewportSize({width:390,height:844});
  await page.locator('button[aria-controls=lesson-list]').click();
  await page.locator('#lesson-list button').nth(1).click();
  await page.locator('#types-typeof .cm-content').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'test/mobile.png',fullPage:true});
  assert.deepEqual(errors, []);
  console.log('PASS: 9 course solutions; strict type comparison; syntax errors; timeout; lesson completion; localStorage reload; mobile navigation; no horizontal overflow; no page errors.');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
