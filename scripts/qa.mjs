/**
 * Layout QA for lessons. Walks every step of every written lesson in a real browser and reports:
 *   - nodes that overlap, labels/fields that are clipped, screens or lists that overflow
 *   - console errors and warnings (unknown glossary terms, unlisted lessons, React warnings)
 *
 * Usage:  npm run dev           (in another terminal)
 *         npm run qa            → all courses
 *         npm run qa -- mern event-loop,cors   → some lessons of one course
 * Env:    QA_BASE=http://localhost:5280
 */
import { chromium } from 'playwright';

const base = process.env.QA_BASE ?? 'http://localhost:5280';
const [onlyCourse, onlyLessons] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = new Set();
page.on('pageerror', (e) => errors.add('pageerror: ' + e.message));
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.add(`${m.type()}: ${m.text().slice(0, 240)}`));

/** Everything that can go wrong with the current layout, as a list of messages. */
const inspect = () =>
  page.evaluate(() => {
    const out = [];
    const nodes = [...document.querySelectorAll('.stage-world .node:not(.node--zone):not(.node--note)')]
      .filter((el) => parseFloat(el.style.opacity || '1') > 0.6)
      .map((el) => ({ id: el.dataset.node, r: el.getBoundingClientRect() }));
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i].r;
        const b = nodes[j].r;
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 2 && h > 2) out.push(`overlap: ${nodes[i].id} × ${nodes[j].id}`);
      }
    // Dot captions sit outside their node: check the actual text against other nodes and captions.
    const texts = [...document.querySelectorAll('.stage-world .dot-caption > span')]
      .filter((el) => parseFloat(el.closest('.node').style.opacity || '1') > 0.6)
      .map((el) => ({ id: el.closest('.node').dataset.node, r: el.getBoundingClientRect() }));
    const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    for (const t of texts) {
      for (const n of nodes) if (n.id !== t.id && hit(t.r, n.r)) out.push(`caption of ${t.id} covers ${n.id}`);
      for (const u of texts) if (u.id < t.id && hit(t.r, u.r)) out.push(`captions of ${u.id} and ${t.id} collide`);
    }
    const clip = (sel, what) =>
      document.querySelectorAll('.stage-world ' + sel).forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 1) out.push(`clipped ${what}: "${el.textContent.trim().slice(0, 40)}" in ${el.closest('.node')?.dataset.node}`);
      });
    clip('.node-label', 'label');
    clip('.node-sub', 'sub');
    clip('.doc-field', 'field');
    clip('.doc-head', 'title');
    clip('.chip', 'chip');
    clip('.browser-url', 'url');
    clip('.list-head', 'list title');
    clip('.codecard-body', 'code');
    clip('.list-item', 'list row');
    document.querySelectorAll('.stage-world .browser-body, .stage-world .list-body').forEach((el) => {
      if (el.scrollHeight > el.clientHeight + 2) out.push(`overflow: ${el.className.split(' ')[0]} in ${el.closest('.node')?.dataset.node}`);
      if (el.closest('.list--x') && el.scrollWidth > el.clientWidth + 2) out.push(`overflow: queue in ${el.closest('.node')?.dataset.node}`);
    });
    // The narrative column must never scroll sideways (long inline code, wide tables…).
    const narr = document.querySelector('.narr');
    if (narr && narr.scrollWidth > narr.clientWidth + 1) out.push(`narrative overflows sideways by ${narr.scrollWidth - narr.clientWidth}px`);
    // Sandbox outcomes are computed: make sure no NaN / undefined leaks into what the learner sees.
    const sb = document.querySelector('.sandbox');
    if (sb) {
      const seen = [sb, document.querySelector('.stage-world'), document.querySelector('.metrics')].map((el) => el?.textContent ?? '').join(' ');
      if (/\bNaN\b|Infinity/.test(seen)) out.push('sandbox shows NaN/Infinity');
      if (/\bundefined\b/.test(sb.textContent)) out.push('sandbox shows "undefined"');
    }
    return out;
  });

let sandboxStates = 0;
async function check(where) {
  await page.waitForTimeout(720); // let the tween settle
  const found = await inspect();
  if (found.length) {
    issues += found.length;
    console.log(`✗ ${where}\n    ` + found.join('\n    '));
  }
}

/** Drive every control of a "Try it" step to its extremes and check each resulting diagram. */
async function exerciseSandbox(where) {
  const sb = page.locator('.sandbox');
  const reset = async () => {
    if (await sb.locator('.sandbox-reset').isEnabled()) await sb.locator('.sandbox-reset').click();
  };
  const ranges = sb.locator('input[type=range]');
  for (let i = 0; i < (await ranges.count()); i++) {
    const r = ranges.nth(i);
    const name = await r.evaluate((el) => el.closest('.sb-row').querySelector('.sb-label').firstChild.textContent);
    for (const end of ['min', 'max']) {
      await r.evaluate((el, end) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, el[end]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, end);
      sandboxStates++;
      await check(`${where} [${name} = ${end}]`);
    }
    await reset();
  }
  const toggles = sb.locator('.sb-switch');
  for (let i = 0; i < (await toggles.count()); i++) {
    await toggles.nth(i).click();
    sandboxStates++;
    await check(`${where} [${await toggles.nth(i).getAttribute('aria-label')} flipped]`);
    await reset();
  }
  const groups = sb.locator('.sb-choice');
  for (let i = 0; i < (await groups.count()); i++) {
    const opts = groups.nth(i).locator('button');
    for (let j = 0; j < (await opts.count()); j++) {
      if ((await opts.nth(j).getAttribute('aria-checked')) === 'true') continue;
      await opts.nth(j).click();
      sandboxStates++;
      await check(`${where} [${await groups.nth(i).getAttribute('aria-label')} = ${await opts.nth(j).textContent()}]`);
    }
    await reset();
  }
  // everything at once: every range at max, every toggle flipped
  for (let i = 0; i < (await ranges.count()); i++)
    await ranges.nth(i).evaluate((el) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, el.max);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  for (let i = 0; i < (await toggles.count()); i++) await toggles.nth(i).click();
  if ((await ranges.count()) + (await toggles.count()) > 1) {
    sandboxStates++;
    await check(`${where} [all at max]`);
  }
  await reset();
  await page.evaluate(() => document.activeElement?.blur());
}

// Discover courses from the home page, lessons from each course page.
await page.goto(base, { waitUntil: 'networkidle' });
const courses = onlyCourse ? [onlyCourse] : await page.$$eval('.course-card', (as) => as.map((a) => new URL(a.href).pathname.slice(1)));
let issues = 0;
let steps = 0;

for (const course of courses) {
  await page.goto(`${base}/${course}`, { waitUntil: 'networkidle' });
  let lessons = await page.$$eval('a.lcard', (as) => as.map((a) => new URL(a.href).pathname.split('/')[2]));
  if (onlyLessons) lessons = onlyLessons.split(',');
  for (const id of lessons) {
    await page.goto(`${base}/${course}/${id}?s=1`, { waitUntil: 'networkidle' });
    const n = await page.locator('.seg').count();
    for (let s = 1; s <= n; s++) {
      if (s > 1) await page.keyboard.press('ArrowRight');
      steps++;
      await check(`${course}/${id} step ${s}`);
      if (await page.locator('.sandbox').count()) await exerciseSandbox(`${course}/${id} step ${s}`);
    }
  }
}

if (errors.size) console.log('\nConsole:\n    ' + [...errors].join('\n    '));
console.log(`\n${issues || errors.size ? '✗' : '✓'} ${steps} steps checked (+${sandboxStates} sandbox states) · ${issues} layout issues · ${errors.size} console messages`);
await browser.close();
process.exit(issues || errors.size ? 1 : 0);
