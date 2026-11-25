/**
 * Layout QA for lessons. Walks every step of every written lesson in a real browser and reports:
 *   - nodes that overlap, labels/fields that are clipped, screens or lists that overflow
 *   - console errors and warnings (unknown glossary terms, unlisted lessons, React warnings)
 *
 * Usage:  npm run dev           (in another terminal)
 *         npm run qa            → all courses
 *         npm run qa -- mern event-loop,cors   → some lessons of one course
 *         npm run qa -- manual                 → only the Manual (contents + every chapter)
 *         npm run qa -- doors                  → only Home and the three doors (Explore, Build, Path)
 * Env:    QA_BASE=http://localhost:5280
 *         QA_CHANNEL=msedge   (use an installed Edge/Chrome when Playwright's own browser isn't downloaded)
 */
import { chromium } from 'playwright';

const base = process.env.QA_BASE ?? 'http://localhost:5280';
const [onlyCourse, onlyLessons] = process.argv.slice(2);
/** `npm run qa -- manual`: only the Manual's contents and chapters. `-- doors`: only Home and the three doors. */
const manualOnly = onlyCourse === 'manual';
const doorsOnly = onlyCourse === 'doors';
const partOnly = manualOnly || doorsOnly;

const launch = () => chromium.launch(process.env.QA_CHANNEL ? { channel: process.env.QA_CHANNEL } : {});
let browser = await launch();
/**
 * A clean browser for the next pass. Hundreds of dev-server page loads in one browser can exhaust it
 * (net::ERR_INSUFFICIENT_RESOURCES), so the Manual and the doors each start fresh.
 */
async function freshBrowser() {
  await browser.close();
  browser = await launch();
}

/** A new tab (its own context, so its own renderer) that reports console warnings and page errors. */
async function openTab(width, height) {
  const tab = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
  tab.on('pageerror', (e) => errors.add('pageerror: ' + e.message));
  tab.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.add(`${m.type()}: ${m.text().slice(0, 240)}`));
  return tab;
}
/**
 * Full page loads one tab makes before it is swapped for a fresh one. Every load of the dev server
 * fetches hundreds of modules, and a tab that has made a few dozen loads starts failing with
 * net::ERR_INSUFFICIENT_RESOURCES (seen on Linux with Playwright's Chromium).
 */
const LOADS_PER_TAB = 8;
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

/** Check that practice starter fails tests and solution passes. */
async function exercisePractice(where) {
  const panel = page.locator('.practice-panel');
  if (await panel.count()) {
    // 1. Run starter -> must NOT pass all
    await panel.locator('button:has-text("Run")').click();
    await page.waitForTimeout(400);
    const passedEarly = await panel.locator('.practice-pass').count();
    if (passedEarly > 0) {
      issues++;
      console.log(`✗ ${where}\n    practice starter passed all tests unexpectedly`);
    }

    // 2. Click show solution -> confirm -> run -> must pass all
    const solBtn = panel.locator('.practice-solution-btn');
    if (await solBtn.count()) {
      await solBtn.click();
      await page.waitForTimeout(100);
      const confirmBtn = panel.locator('button:has-text("I\'m stuck")');
      if (await confirmBtn.count()) await confirmBtn.click();
      await panel.locator('button:has-text("Run")').click();
      await page.waitForTimeout(600);
      const passedLate = await panel.locator('.practice-pass').count();
      if (passedLate === 0) {
        issues++;
        console.log(`✗ ${where}\n    practice solution failed tests`);
      }
    }
  }
}

// Discover courses from the Library (each course map is marked with data-course), lessons from each course page.
await page.goto(`${base}/library`, { waitUntil: 'networkidle' });
const courses = partOnly ? [] : onlyCourse ? [onlyCourse] : await page.$$eval('a[data-course]', (as) => as.map((a) => a.dataset.course));
let issues = 0;
let steps = 0;

for (const course of courses) {
  await page.goto(`${base}/${course}`, { waitUntil: 'networkidle' });
  let lessons = await page.$$eval('a.lcard', (as) => as.map((a) => new URL(a.href).pathname.split('/')[2]));
  if (onlyLessons) lessons = onlyLessons.split(',');
  for (const id of lessons) {
    await page.goto(`${base}/${course}/${id}?s=1`, { waitUntil: 'networkidle' });
    const n = await page.locator('.seg, .tl-step').count();
    for (let s = 1; s <= n; s++) {
      if (s > 1) await page.keyboard.press('ArrowRight');
      steps++;
      await check(`${course}/${id} step ${s}`);
      if (await page.locator('.sandbox').count()) await exerciseSandbox(`${course}/${id} step ${s}`);
      if (await page.locator('.practice-panel').count()) await exercisePractice(`${course}/${id} step ${s}`);
    }
  }
}

// Roadmap graph: its layout is computed from course.ts and changes shape with the screen
// (4, 3 or 2 parts per row). No label may sit on another label, bubble, hub or gate.
let roadmaps = 0;
if (!onlyLessons && !partOnly) {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // skip the intro fly-in
  for (const course of courses)
    for (const [width, height] of [[1440, 900], [1000, 1050], [420, 900]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${base}/${course}/roadmap`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      roadmaps++;
      const found = await page.evaluate(() => {
        const boxes = [];
        for (const g of document.querySelectorAll('.rm-node')) {
          for (const el of g.querySelectorAll('.rm-shape, .rm-label, .rm-hub-title, .rm-hub-sub, .rm-gate-label')) {
            const r = el.getBoundingClientRect();
            if (r.width && r.height) boxes.push({ id: g.dataset.n, kind: el.classList[0], r });
          }
        }
        const out = [];
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) {
            const [a, b] = [boxes[i], boxes[j]];
            if (a.id === b.id) continue;
            const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
            const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
            if (w > 1 && h > 1) out.push(`${a.id} ${a.kind} × ${b.id} ${b.kind}`);
          }
        return out;
      });
      if (found.length) {
        issues += found.length;
        console.log(`✗ ${course}/roadmap at ${width}×${height}\n    ` + found.join('\n    '));
      }
    }
}

// The Manual: the contents and every chapter, on a laptop and a phone. Nothing may scroll sideways,
// and a written chapter's interactive pieces (predict, break-it reveals, the AI tab) must open cleanly.
let chapters = 0;
if (!onlyLessons && !doorsOnly) {
  if (!manualOnly) await freshBrowser();
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    let page = await openTab(width, height);
    await page.goto(`${base}/manual`, { waitUntil: 'networkidle' });
    const hrefs = await page.$$eval('a.mn-row', (as) => as.map((a) => new URL(a.href).pathname).filter((p) => p.startsWith('/manual/')));
    let loads = 1;
    for (const path of ['/manual', ...hrefs]) {
      if (loads++ % LOADS_PER_TAB === 0) {
        await page.close();
        page = await openTab(width, height);
      }
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      chapters++;
      const where = `${path} at ${width}px`;
      if (await page.locator('.mn-predict').count()) {
        await page.locator('.mn-opt').first().click();
        // each reveal removes its button, so always click the first one left
        while (await page.locator('.mn-break-btn').count()) await page.locator('.mn-break-btn').first().click();
        await page.locator('.mn-tabs [role=tab]').nth(1).click();
        await page.locator('.mn-deep summary').first().click();
      }
      const wide = await page.evaluate(() => {
        const out = [];
        if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page scrolls sideways (${document.documentElement.scrollWidth}px)`);
        for (const el of document.querySelectorAll('.mn-ch-main > *, .mn-rows, .mn-hero'))
          if (el.getBoundingClientRect().right > window.innerWidth + 1) out.push(`${el.className.split(' ')[0]} runs off the screen`);
        return out;
      });
      if (wide.length) {
        issues += wide.length;
        console.log(`✗ ${where}\n    ` + wide.join('\n    '));
      }
    }
    await page.close();
  }
}

// Home and the three doors: each page on a laptop and a phone, driven the way a learner would —
// peek at a question, filter, "surprise me"; pick an idea, switch a feature, type an idea of your own;
// then a chapter page showing that build's trail. Nothing may scroll sideways or run off the screen.
let doorPages = 0;
if (!onlyLessons && !manualOnly) {
  if (!doorsOnly) await freshBrowser();
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const page = await openTab(width, height);
    const fits = async (where) => {
      doorPages++;
      const wide = await page.evaluate(() => {
        const out = [];
        if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page scrolls sideways (${document.documentElement.scrollWidth}px)`);
        for (const el of document.querySelectorAll('.dr-head, .dr-toolbar, .dr-feed > *, .dr-ideas, .dr-build-grid > *, .dr-rows, .dr-next, .dr-stage, .dr-doors-grid > *, .dr-trail'))
          if (el.getBoundingClientRect().right > window.innerWidth + 1) out.push(`${el.className.split(' ')[0]} runs off the screen`);
        return out;
      });
      if (wide.length) {
        issues += wide.length;
        console.log(`✗ ${where} at ${width}px\n    ` + wide.join('\n    '));
      }
    };
    const door = async (path, act) => {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(200);
      if (act) await act();
      await fits(path);
    };
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('unpacked:build:v1'));
    await door('/');
    await door('/explore', async () => {
      await page.locator('.dr-q button:has-text("Peek")').first().click();
      await page.locator('.dr-surprise').click();
      await page.locator('.dr-filter .mn-chip:not(:disabled)').last().click();
      await page.locator('.dr-q button:has-text("Peek")').first().click();
    });
    await door('/build', async () => {
      await page.locator('.dr-idea').nth(3).click();
      await page.locator('.dr-feat').first().click();
      await page.locator('#build-what').fill('a booking site for my salon where people log in, pay, and get a reminder email');
      await page.waitForTimeout(150);
    });
    await door('/path');
    await door('/', async () => {
      if (!(await page.locator('.dr-door-mine').count())) {
        issues++;
        console.log(`✗ / at ${width}px\n    the Build door doesn't show the build that was just planned`);
      }
    });
    await door('/manual/identity', async () => {
      if (!(await page.locator('.dr-trail').count())) {
        issues++;
        console.log(`✗ /manual/identity at ${width}px\n    no "your build" trail, though the build needs this chapter`);
      }
    });
    await door('/library');
    await page.evaluate(() => {
      localStorage.removeItem('unpacked:build:v1');
      localStorage.removeItem('unpacked:explore:seen');
    });
    await page.close();
  }
}

if (errors.size) console.log('\nConsole:\n    ' + [...errors].join('\n    '));
console.log(`\n${issues || errors.size ? '✗' : '✓'} ${steps} steps checked (+${sandboxStates} sandbox states, ${roadmaps} roadmap layouts, ${chapters} manual pages, ${doorPages} door pages) · ${issues} layout issues · ${errors.size} console messages`);
await browser.close();
process.exit(issues || errors.size ? 1 : 0);
