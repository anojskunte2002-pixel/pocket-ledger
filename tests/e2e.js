// End-to-end run in Chromium: node tests/e2e.js [shots-dir]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHOTS = process.argv[2] || path.join(ROOT, 'shots');
const FONTS = process.env.FONTS_DIR || '';
fs.mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const ok = (cond, msg) => { if (cond) console.log('  ok  ', msg); else { failures++; console.log('  FAIL', msg); } };

async function fontRoutes(ctx) {
  if (!FONTS || !fs.existsSync(path.join(FONTS, 'fonts.css'))) return;
  const css = fs.readFileSync(path.join(FONTS, 'fonts.css'), 'utf8');
  await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: css }));
  await ctx.route('https://fonts.gstatic.com/**', r => {
    const f = path.join(FONTS, r.request().url().replace('https://fonts.gstatic.com/', '').replace(/\//g, '_'));
    return fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'font/woff2' }) : r.abort();
  });
}

// A stand-in for the claude.ai runtime: db with merge semantics, Claude answers, a signed-in owner.
const MOCK = `
(() => {
  const docs = {};
  const listeners = [];
  const clone = v => JSON.parse(JSON.stringify(v));
  const merge = (t, p) => { for (const k in p) { const v = p[k]; if (v && typeof v === 'object' && !Array.isArray(v) && t[k] && typeof t[k] === 'object' && !Array.isArray(t[k])) merge(t[k], v); else t[k] = v; } return t; };
  const snapDoc = p => ({ id: p.split('/').pop(), exists: !!docs[p], data: () => (docs[p] ? Object.freeze(clone(docs[p])) : undefined), metadata: { fromCache: false, hasPendingWrites: false } });
  const colDocs = path => { const n = path.split('/').length + 1; return Object.keys(docs).filter(p => p.indexOf(path + '/') === 0 && p.split('/').length === n).sort().map(snapDoc); };
  const fire = () => setTimeout(() => { for (const l of listeners) { const d = colDocs(l.path); l.cb({ docs: d, size: d.length, empty: !d.length, docChanges: () => [], metadata: {} }); } }, 15);
  window.__writes = 0;
  const doc = p => ({ id: p.split('/').pop(), path: p,
    get: async () => snapDoc(p),
    set: async d => { window.__writes++; docs[p] = clone(d); fire(); },
    update: async d => { window.__writes++; if (!docs[p]) throw { code: 'invalid_argument', message: 'missing doc' }; merge(docs[p], clone(d)); fire(); },
    delete: async () => { delete docs[p]; fire(); } });
  const db = { doc, collection: p => ({ path: p, doc: id => doc(p + '/' + id),
    onSnapshot: (cb) => { const l = { path: p, cb }; listeners.push(l); setTimeout(() => { const d = colDocs(p); cb({ docs: d, size: d.length, empty: !d.length, docChanges: () => [], metadata: {} }); }, 30); return () => listeners.splice(listeners.indexOf(l), 1); } }) };
  window.__docs = docs;
  const sample = async (input, opts) => {
    const text = 'Your biggest category is **Food & Dining**.\\n- Groceries come next\\n- Shopping is down';
    await new Promise(r => setTimeout(r, 60));
    if (opts && opts.onText) opts.onText({ text, delta: text });
    return { text, truncated: false, modelTierApplied: 'quick' };
  };
  sample.json = async (input, opts) => {
    window.__aiCalls = (window.__aiCalls || 0) + 1;
    if (opts && opts.images) return { entries: [{ type: 'expense', amount: 1840, category: 'groceries', date: '2026-10-27', note: 'groceries', merchant: 'DMart', method: 'Card', repeat: 'none' }], currency: 'INR' };
    const m = /Note: """([\\s\\S]*?)"""/.exec(String(input));
    const note = m ? m[1] : '';
    if (/gas 45/i.test(note)) return { entries: [{ type: 'expense', amount: 45, category: 'transport', date: '2026-10-28', note: 'Gas', merchant: 'Shell', method: 'Card', repeat: 'none' }] };
    return { entries: [] };
  };
  sample.limits = async () => ({ maxPromptBytes: 262144, images: { maxCount: 4, maxInputBytes: 20000000, mediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] }, tools: { maxCount: 8 } });
  const user = { isOwner: async () => true, id: async () => 'u_test', canEdit: async () => true, can: async () => true, me: async () => ({ id: 'u_test', name: '' }) };
  window.claude = { use: async name => ({ db, user, sample }[name] || null) };
})();`;

async function run(label, opts) {
  console.log('\n== ' + label);
  const browser = await chromium.launch();
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light', hasTouch: true }, opts.ctx || {}));
  await fontRoutes(ctx);
  if (opts.mock) await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.join(ROOT, 'dist', 'local.html'));
  await opts.steps(page, label);
  ok(errors.length === 0, 'no page errors' + (errors.length ? ' → ' + errors.slice(0, 5).join(' | ') : ''));
  await browser.close();
}
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false });
const settle = page => page.waitForTimeout(250);
async function typeEntry(page, text) { await page.fill('#entry', text); await page.waitForTimeout(160); }

(async () => {
  await run('device mode · en-IN', {
    ctx: { locale: 'en-IN', timezoneId: 'Asia/Kolkata' },
    steps: async page => {
      await page.waitForSelector('.welcome', { timeout: 5000 });
      ok(true, 'welcome screen shows on an empty ledger');
      await shot(page, '01-welcome');
      await typeEntry(page, 'coffee 120');
      const slip = await page.textContent('#slips');
      ok(/Food & Dining/.test(slip) && /120/.test(slip), 'live preview shows category and amount: ' + slip.replace(/\s+/g, ' ').trim());
      await shot(page, '02-preview');
      await page.press('#entry', 'Enter');
      await page.waitForSelector('.hero', { timeout: 3000 });
      ok((await page.textContent('.hero-num')).includes('120'), 'home hero shows spent total');
      ok((await page.textContent('#toast-root')).includes('Added'), 'toast confirms the entry');
      ok((await page.inputValue('#entry')) === '', 'input clears after saving');
      await typeEntry(page, 'Uber 230 yesterday on card, salary 85k credited');
      ok((await page.$$('.slip')).length === 2, 'two entries previewed from one line');
      await page.press('#entry', 'Enter');
      await settle(page);
      const stored = await page.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf('pocketledger') === 0));
      ok(stored.some(k => /ledger:\d{4}-\d{2}/.test(k)), 'entries saved to this device: ' + stored.join(','));
      // budget command
      await typeEntry(page, 'monthly budget 45000');
      ok((await page.textContent('#slips')).includes('monthly budget'), 'budget command previewed');
      await page.press('#entry', 'Enter');
      await settle(page);
      ok((await page.textContent('.hero')).includes('45,000'), 'hero shows the budget');
      await shot(page, '03-home-own');
      // edit the coffee entry
      await page.click('.row >> text=Coffee');
      await page.waitForSelector('.sheet');
      await shot(page, '04-editor');
      await page.click('.cat-opt >> text=Groceries');
      await page.click('[data-act="ed-save"]');
      await settle(page);
      ok((await page.textContent('#toast-root')).includes('from now on'), 'changing a category teaches a shortcut');
      // the shortcut is used next time
      await typeEntry(page, 'coffee 90');
      ok((await page.textContent('#slips')).includes('Groceries'), 'learned shortcut applied to the next entry');
      await page.fill('#entry', '');
      // example data
      await page.click('#open-settings');
      await page.click('[data-act="examples"]');
      await page.waitForTimeout(400);
      ok((await page.textContent('#banner')).includes('example data'), 'example banner shown');
      const n = await page.evaluate(() => document.querySelectorAll('.row').length);
      ok(n >= 5, 'home lists recent entries (' + n + ')');
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, '05-home-examples');
      // insights
      await page.click('[data-tab="insights"]');
      await page.waitForSelector('.chart svg', { timeout: 3000 });
      const charts = await page.$$eval('.chart svg', s => s.length);
      ok(charts === 3, 'insights draws three SVG charts (' + charts + ')');
      ok((await page.$$('.ins')).length >= 3, 'insights list has items');
      ok((await page.$$('.hm-c')).length >= 28, 'calendar heatmap rendered');
      await shot(page, '06-insights-top');
      const pace = await page.$('.chart[data-chart="pace"] svg');
      await pace.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      const box = await pace.boundingBox();
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.waitForTimeout(80);
      ok(!(await page.$eval('#tip', t => t.hidden)), 'hovering the chart shows a tooltip');
      await page.click('[data-act="toggle-table"][data-arg="pace"]');
      ok((await page.$$('.tbl')).length >= 1, 'chart table view works');
      await page.click('[data-act="toggle-table"][data-arg="pace"]');
      await page.evaluate(() => window.scrollTo(0, 900));
      await page.waitForTimeout(150);
      await shot(page, '07-insights-charts');
      await page.evaluate(() => window.scrollTo(0, 2200));
      await page.waitForTimeout(150);
      await shot(page, '08-insights-habits');
      // activity + search
      await page.click('[data-tab="activity"]');
      await page.waitForSelector('#act-q');
      await page.fill('#act-q', 'netflix');
      await page.waitForTimeout(100);
      const found = await page.$$eval('.row', r => r.length);
      ok(found >= 2, 'search finds Netflix across months (' + found + ')');
      await page.fill('#act-q', '');
      await page.waitForTimeout(100);
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, '09-activity');
      // budgets
      await typeEntry(page, 'budget food 8000');
      await page.press('#entry', 'Enter');
      await settle(page);
      await page.click('[data-tab="budgets"]');
      await page.waitForSelector('.bud-row', { timeout: 4000 });
      ok((await page.textContent('.bud-row')).includes('Food'), 'category budget set by typing');
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, '10-budgets');
      // bank SMS import
      await page.click('#add-btn');
      await page.click('[data-act="import-sms"]');
      await page.fill('#imp-text', 'Rs.450.00 debited from A/c XX1234 on 28-10-26 to VPA swiggy@axisbank. UPI Ref 123456789012.\n\nINR 1,250.00 spent on your HDFC Bank Credit Card ending 1234 at AMAZON on 2026-10-27. Avl Lmt: INR 45,000');
      await page.click('[data-act="imp-read"]');
      await page.waitForSelector('.imp-row');
      ok((await page.$$('.imp-row')).length === 2, 'two bank messages read');
      await shot(page, '11-import-sms');
      await page.click('[data-act="imp-save"]');
      await settle(page);
      ok((await page.textContent('#toast-root')).includes('Added'), 'imported messages saved');
      // CSV import
      const csv = path.join(SHOTS, 'statement.csv');
      fs.writeFileSync(csv, 'Date,Narration,Withdrawal Amt.,Deposit Amt.,Closing Balance\n03/10/2026,UPI/P2M/1234567/ZEPTO,612.00,,10000.00\n04/10/2026,POS 4321 SHELL PETROL,2000.00,,8000.00\n05/10/2026,NEFT CR ACME CORP SALARY,,90000.00,98000.00\n');
      await page.click('#add-btn');
      await page.click('[data-act="import-csv"]');
      await page.setInputFiles('#file-csv', csv);
      await page.waitForSelector('.imp-row');
      const rows = await page.$$eval('.imp-row', r => r.map(x => x.textContent.replace(/\s+/g, ' ')));
      ok(rows.length === 3, 'CSV rows found: ' + rows.join(' | ').slice(0, 200));
      await page.click('[data-act="imp-save"]');
      await settle(page);
      // export: as a plain website the file downloads directly
      await page.click('#open-settings');
      await shot(page, '12-settings');
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act="export-csv"]')]);
      const csvOut = fs.readFileSync(await dl.path(), 'utf8');
      ok(/Date,Type,Amount/.test(csvOut) && csvOut.split('\n').length > 50, 'CSV export downloads (' + dl.suggestedFilename() + ')');
      // clear examples keeps own entries
      await page.click('.sheet [data-act="clear-examples"]');
      await page.waitForTimeout(300);
      const left = await page.evaluate(() => { let n = 0; for (const k of Object.keys(localStorage)) if (/v1:ledger:/.test(k)) n += Object.values(JSON.parse(localStorage[k]).entries).length; return n; });
      ok(left >= 7 && left < 20, 'clearing examples keeps your own entries (' + left + ' left)');
      // reload persists
      await page.reload();
      await page.waitForSelector('.hero');
      ok((await page.textContent('.hero')).includes('45,000'), 'data persists after reload');
      // no horizontal scroll
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(wide <= 0, 'no horizontal scrolling at phone width (' + wide + ')');
    }
  });

  await run('cloud mode (mocked runtime) · en-US', {
    mock: true,
    ctx: { locale: 'en-US', timezoneId: 'America/New_York', colorScheme: 'dark', viewport: { width: 1280, height: 860 }, hasTouch: false },
    steps: async page => {
      await page.waitForSelector('.welcome', { timeout: 6000 });
      await shot(page, '20-welcome-dark-desktop');
      await typeEntry(page, 'gas 45');
      await page.press('#entry', 'Enter');
      await page.waitForSelector('.hero', { timeout: 4000 });
      const calls = await page.evaluate(() => window.__aiCalls || 0);
      ok(calls === 1, 'unclear entry asked Claude once');
      const docs = await page.evaluate(() => JSON.parse(JSON.stringify(window.__docs)));
      const ledger = Object.keys(docs).filter(k => k.indexOf('ledger/') === 0);
      ok(ledger.length === 1, 'entry written to a month document: ' + ledger.join(','));
      const ent = ledger.length ? Object.values(docs[ledger[0]].entries)[0] : {};
      ok(ent.cat === 'transport' && ent.amount === 45, 'Claude’s category stored: ' + JSON.stringify(ent).slice(0, 120));
      ok(!!docs['meta/settings'] && docs['meta/settings'].currency === 'USD', 'settings pinned with USD');
      await typeEntry(page, 'coffee 4.50');
      await page.press('#entry', 'Enter');
      await page.waitForTimeout(300);
      ok((await page.evaluate(() => window.__aiCalls)) === 1, 'clear entries are parsed locally without Claude');
      // delete with undo
      await page.click('.row >> text=Coffee');
      await page.click('[data-act="ed-delete"]');
      await page.waitForTimeout(250);
      ok(!(await page.$('.row >> text=Coffee')), 'deleted entry disappears');
      await page.click('#toast-root button >> text=Undo');
      await page.waitForTimeout(300);
      ok(!!(await page.$('.row >> text=Coffee')), 'undo brings it back');
      // repeating entry
      await typeEntry(page, 'Netflix 15.49 monthly');
      await page.press('#entry', 'Enter');
      await page.waitForTimeout(300);
      const rec = await page.evaluate(() => window.__docs['meta/recurring']);
      ok(rec && Object.keys(rec.items).length === 1, 'repeating rule saved');
      // receipt scan via file input
      const png = path.join(SHOTS, 'receipt.png');
      fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
      await page.setInputFiles('#file-img', png);
      await page.waitForSelector('#ed-amount', { timeout: 4000 });
      ok((await page.inputValue('#ed-amount')) === '1840', 'receipt amount read into the editor');
      await page.click('[data-act="ed-save"]');
      await page.waitForTimeout(300);
      // examples + insights + ask
      await page.click('#open-settings');
      await page.click('[data-act="examples"]');
      await page.waitForTimeout(500);
      await page.click('[data-tab="insights"]');
      await page.waitForSelector('.chart svg');
      await page.click('[data-act="ask-sugg"] >> nth=0');
      await page.waitForSelector('.a', { timeout: 3000 });
      ok((await page.textContent('#ask-log')).includes('Food & Dining'), 'answer streams into the ask card');
      await shot(page, '21-insights-dark-desktop');
      await page.evaluate(() => window.scrollTo(0, 1100));
      await page.waitForTimeout(150);
      await shot(page, '22-insights-dark-charts');
      await page.click('[data-tab="home"]');
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, '23-home-dark-desktop');
      const size = await page.evaluate(() => Math.max(...Object.keys(window.__docs).filter(k => k.indexOf('ledger/') === 0).map(k => JSON.stringify(window.__docs[k]).length)));
      ok(size < 200000, 'largest month document stays small (' + size + ' bytes)');
    }
  });

  await (async () => {
    console.log('\n== website build · offline');
    const http = require('http');
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
    const server = http.createServer((req, res) => {
      let f = path.join(ROOT, 'docs', decodeURIComponent(req.url.split('?')[0]));
      if (f.endsWith('/')) f += 'index.html';
      if (!f.startsWith(path.join(ROOT, 'docs')) || !fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const base = 'http://localhost:' + server.address().port + '/';
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    await fontRoutes(ctx);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base);
    await page.waitForSelector('.welcome');
    const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]').href)).json());
    ok(manifest.name === 'Pocket Ledger' && manifest.icons.length === 3, 'web app manifest loads');
    const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
    ok(sw, 'offline worker is active');
    await page.reload();
    await page.waitForSelector('.welcome');
    ok(await page.evaluate(() => !!navigator.serviceWorker.controller), 'page is served through the offline worker');
    await typeEntry(page, 'chai 20');
    await page.press('#entry', 'Enter');
    await page.waitForSelector('.hero');
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector('.hero', { timeout: 5000 });
    ok((await page.textContent('.hero-num')).includes('20'), 'reloads offline with saved entries');
    ok((await page.textContent('#banner')).includes('private in this browser'), 'website explains where entries are kept');
    await page.click('#open-settings');
    ok((await page.textContent('.sheet')).includes('This device'), 'settings explain installing the app');
    await ctx.setOffline(false);
    ok(errors.length === 0, 'no page errors' + (errors.length ? ' → ' + errors.join(' | ') : ''));
    await browser.close();
    server.close();
  })();

  console.log('\n' + (failures ? failures + ' check(s) failed' : 'all checks passed'));
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
