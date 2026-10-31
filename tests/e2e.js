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
  const seed = window.__seed || {};
  const docs = JSON.parse(JSON.stringify(seed.docs || {}));
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
  const uid = seed.uid || 'u_test';
  const user = { isOwner: async () => seed.owner !== false, id: async () => uid, canEdit: async () => true, can: async () => true, me: async () => ({ id: uid, name: '' }) };
  window.claude = { use: async name => ({ db, user, sample }[name] || null) };
})();`;

async function run(label, opts) {
  console.log('\n== ' + label);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light', hasTouch: true }, opts.ctx || {}));
  await fontRoutes(ctx);
  if (opts.seed) await ctx.addInitScript('window.__seed = ' + JSON.stringify(opts.seed) + ';');
  if (opts.mock) await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.join(ROOT, 'dist', 'local.html'));
  try { await opts.steps(page, label); }
  catch (e) { console.log('  page errors so far: ' + (errors.join(' | ') || 'none')); await shot(page, 'fail-' + label.replace(/\W+/g, '-')); throw e; }
  ok(errors.length === 0, 'no page errors' + (errors.length ? ' → ' + errors.slice(0, 5).join(' | ') : ''));
  await browser.close();
}
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false });
const settle = page => page.waitForTimeout(250);
async function typeEntry(page, text) { await page.fill('#entry', text); await page.waitForTimeout(160); }
// like tapping outside the entry box: the bar folds back into tabs
async function closeBar(page) { await page.evaluate(() => { const e = document.getElementById('entry'); e.value = ''; e.dispatchEvent(new Event('input')); e.blur(); }); await page.waitForTimeout(550); }

(async () => {
  await run('device mode · two people · en-IN', {
    ctx: { locale: 'en-IN', timezoneId: 'Asia/Kolkata' },
    steps: async page => {
      await page.waitForSelector('.welcome', { timeout: 6000 });
      ok(true, 'welcome screen shows on an empty ledger');
      ok(await page.evaluate(() => !document.getElementById('bg').hidden && document.body.classList.contains('tone-light')), 'living background drawn, light scene for a light device');
      await shot(page, '01-welcome');
      // household
      await page.click('.welcome [data-act="household"]');
      await page.fill('#hh-n1', 'Ravi');
      await page.fill('#hh-n2', 'Meera');
      ok((await page.textContent('[data-act="hh-me"][data-arg="p2"]')).includes('Meera'), 'who-is-using choices follow the typed names');
      await shot(page, '02-household');
      await page.click('[data-act="hh-save"]');
      await page.waitForFunction(() => document.getElementById('hh-title').textContent === 'Ravi & Meera', null, { timeout: 4000 }).catch(() => {});
      ok((await page.textContent('#hh-title')) === 'Ravi & Meera', 'header shows the household');
      ok(await page.isVisible('#people'), 'person switcher appears for two people');
      // whose money, from plain words
      await typeEntry(page, 'coffee 120');
      let slip = await page.textContent('#slips');
      ok(/Food & Dining/.test(slip) && /120/.test(slip) && /Ravi paid/.test(slip) && /for Ravi/.test(slip), 'preview shows category, amount, who paid and who it is for: ' + slip.replace(/\s+/g, ' ').trim());
      await page.press('#entry', 'Enter');
      await page.waitForSelector('.hero', { timeout: 3000 });
      ok((await page.textContent('#toast-root')).includes('Added'), 'toast confirms the entry');
      ok((await page.inputValue('#entry')) === '', 'input clears after saving');
      await typeEntry(page, 'Meera paid 450 for groceries');
      let chips = await page.$$eval('.slip-who', b => b.map(x => x.textContent.trim()));
      ok(/Meera paid$/.test(chips[0]) && chips[1] === 'for both', 'groceries Meera paid for count as shared: ' + chips.join(', '));
      await page.press('#entry', 'Enter');
      await settle(page);
      await typeEntry(page, 'Meera paid 600 for dessert for both and Ravi cab 230');
      chips = await page.$$eval('.slip-who', b => b.map(x => x.textContent.trim()));
      ok(chips.length === 4 && /Meera paid$/.test(chips[0]) && chips[1] === 'for both' && /Ravi paid$/.test(chips[2]) && /for Ravi$/.test(chips[3]), 'who paid and who it is for are read per part: ' + chips.join(', '));
      await page.click('.slip-who >> nth=3');
      ok((await page.textContent('.slip-who >> nth=3')).trim() === 'for both', 'tapping the “for” chip makes the cab shared');
      await shot(page, '03-capture');
      await page.press('#entry', 'Enter');
      await settle(page);
      const docs = await page.evaluate(() => { const out = []; for (const k of Object.keys(localStorage)) if (/v1:ledger:/.test(k)) out.push(...Object.values(JSON.parse(localStorage[k]).entries)); return out; });
      const des = docs.find(d => /dessert/i.test(d.note)), cab = docs.find(d => d.amount === 230), gro = docs.find(d => d.amount === 450), cof = docs.find(d => d.amount === 120);
      ok(des && des.paid === 'p2' && des.who === 'joint' && des.by === 'p1', 'dessert saved as paid by Meera, for both, added by Ravi');
      ok(cab && cab.paid === 'p1' && cab.who === 'joint' && gro && gro.paid === 'p2' && gro.who === 'joint' && cof && cof.paid === 'p1' && cof.who === 'p1', 'every entry stores who paid and who it is for');
      // one person's view: her own spending plus her half of shared costs
      await closeBar(page);
      await page.click('#people [data-arg="p2"]');
      await page.waitForSelector('.flow', { timeout: 4000 });
      const heroTo = () => page.$eval('.hero-num', e => e.dataset.count);
      ok((await heroTo()) === '-1050', 'Meera’s money shows what actually left her account: −₹1,050 (' + (await heroTo()) + ')');
      const flowTxt = async () => (await page.textContent('.flow')).replace(/\s+/g, ' ');
      ok(/Paid for both of you.*− ₹1,050/.test(await flowTxt()) && /Own spending.*₹0/.test(await flowTxt()), 'shared costs she paid count in full, not halved: ' + (await flowTxt()).slice(0, 160));
      ok((await page.$$('#view .row')).length === 0, 'her page lists only her own entries by default');
      await page.click('[data-act="with-shared"]');
      await page.waitForFunction(() => document.querySelectorAll('#view .row').length > 0, null, { timeout: 4000 }).catch(() => {});
      ok((await page.$$('#view .row')).length >= 3, 'the shared costs appear only when asked for');
      await page.click('[data-act="with-shared"]');
      await page.waitForFunction(() => document.querySelectorAll('#view .row').length === 0, null, { timeout: 4000 }).catch(() => {});
      ok((await page.textContent('.settle')).includes('Ravi owes Meera') && (await page.textContent('.settle')).includes('410'), 'balance: Ravi owes Meera ₹410: ' + (await page.textContent('.settle')).trim());
      await page.click('.fair-head');
      await page.waitForSelector('.sheet .bd-row');
      ok((await page.$$('.sheet .bd-row')).length === 3 && (await page.textContent('.sheet')).includes('Meera’s part (50%)'), 'the fair split shows each shared cost and her part');
      await page.keyboard.press('Escape');
      await shot(page, '04-person');
      await page.click('.settle [data-act="settle"]');
      await page.waitForSelector('#settle-amt');
      ok((await page.inputValue('#settle-amt')) === '410', 'settle up suggests the full ₹410');
      await page.click('[data-act="settle-save"]');
      await page.waitForSelector('.settle.ok', { timeout: 4000 }).catch(() => {});
      ok(!!(await page.$('.settle.ok')), 'after settling up they are all square');
      const st = await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/v1:ledger:/.test(k)) for (const e of Object.values(JSON.parse(localStorage[k]).entries)) if (e.cat === 'settle') return e; return null; });
      ok(st && st.paid === 'p1' && st.who === 'p2' && st.amount === 410, 'the settle-up is stored as Ravi paying Meera back');
      ok(/Settled up.*\+ ₹410/.test(await flowTxt()) && (await heroTo()) === '-640', 'the repayment lands in her account, not in spending (' + (await heroTo()) + ')');
      await page.click('.hero [data-act="balance-edit"]');
      await page.fill('#bal-amt', '50000');
      await page.click('[data-act="balance-save"]');
      await page.waitForFunction(() => { const h = document.querySelector('.hero-num'); return h && h.dataset.count === '49360'; }, null, { timeout: 4000 }).catch(() => {});
      ok((await heroTo()) === '49360', 'with a starting balance of ₹50,000 her bank shows ₹49,360 (' + (await heroTo()) + ')');
      await page.click('.mf-row.total');
      await page.waitForSelector('.sheet .bd-sum');
      ok(/Started with.*₹50,000/.test((await page.textContent('.sheet')).replace(/\s+/g, ' ')) && (await page.textContent('.sheet')).includes('In the bank now'), 'tapping the balance shows the whole calculation');
      await page.keyboard.press('Escape');
      await page.click('#people [data-arg="all"]');
      // plan the month
      await page.click('[data-tab="plan"]');
      await page.waitForSelector('.setup', { timeout: 3000 });
      await shot(page, '05-plan-setup');
      await page.click('[data-act="plan-quick"][data-arg="fixed:home:Rent"]');
      await page.fill('#pe-amount', '22000');
      await page.selectOption('#pe-day', '2');
      ok(await page.$eval('[data-act="pe-who"][data-arg="joint"]', b => b.getAttribute('aria-checked') === 'true'), 'rent defaults to shared');
      await page.click('[data-act="pe-save"]');
      await page.waitForSelector('.eq', { timeout: 3000 });
      await page.click('.pl-add[data-arg="income"]');
      await page.fill('#pe-amount', '85000');
      await page.fill('#pe-name', 'Salary');
      await page.click('[data-act="pe-who"][data-arg="p1"]');
      await page.click('[data-act="pe-save"]');
      await settle(page);
      await page.click('.pl-add[data-arg="income"]');
      await page.fill('#pe-amount', '72000');
      await page.fill('#pe-name', 'Salary');
      await page.click('[data-act="pe-who"][data-arg="p2"]');
      await page.click('[data-act="pe-save"]');
      await settle(page);
      await page.click('.pl-add[data-arg="fixed"]');
      await page.click('[data-act="pe-cat"][data-arg="sendhome"]');
      await page.fill('#pe-amount', '10000');
      await page.click('[data-act="pe-who"][data-arg="p1"]');
      await page.click('[data-act="pe-save"]');
      await settle(page);
      ok((await page.textContent('.eq-item.res b')).includes('1.25L'), 'everyday money = income − fixed costs: ' + (await page.textContent('.eq-item.res b')));
      await page.click('.sec-head [data-act="plan-goal"]');
      await page.fill('#goal-p1', '15000');
      await page.fill('#goal-p2', '10000');
      await page.click('[data-act="goal-save"]');
      await settle(page);
      ok((await page.textContent('.eq-item.res b')).includes('1L'), 'saving goal comes off the top: ' + (await page.textContent('.eq-item.res b')));
      const links = await page.$$eval('.chart[data-chart="flow"] .fl-link', l => l.length);
      ok(links === 6, 'flow chart joins 2 incomes to 4 uses (' + links + ' ribbons)');
      await page.click('.pl-row:has-text("Rent") .mini-btn');
      await page.waitForSelector('[data-act="plan-pay"][data-arg$="|p1"]');
      ok((await page.$$('.sheet [data-act="plan-pay"]')).length === 2, 'a shared bill asks who paid it');
      await page.click('[data-act="plan-pay"][data-arg$="|p1"]');
      await settle(page);
      ok(!!(await page.$('.pl-row:has-text("Rent") .pl-done')), 'marking rent paid ticks it off');
      const rent = await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/v1:ledger:/.test(k)) for (const e of Object.values(JSON.parse(localStorage[k]).entries)) if (e.plan && e.amount === 22000) return e; return null; });
      ok(rent && rent.who === 'joint' && rent.paid === 'p1' && rent.cat === 'home', 'the payment is logged as shared rent paid by Ravi');
      await page.click('#people [data-arg="p2"]');
      await settle(page);
      const eq2 = await page.$$eval('.eq-item b', b => b.map(x => x.textContent));
      ok(eq2[0].includes('72K') && eq2[1].includes('11K') && eq2[2].includes('10K') && eq2[3].includes('51K'), 'Meera’s own plan: her income, half the rent, her goal: ' + eq2.join(' | '));
      await page.click('#people [data-arg="all"]');
      await settle(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, '06-plan');
      await page.evaluate(() => window.scrollTo(0, 700));
      await page.waitForTimeout(150);
      await shot(page, '07-plan-lists');
      // budget command still works and lands on the plan page
      await typeEntry(page, 'budget food 8000');
      await page.press('#entry', 'Enter');
      await settle(page);
      ok((await page.textContent('.bud-row')).includes('Food'), 'category budget set by typing');
      // home with a plan
      await closeBar(page);
      await page.click('[data-tab="home"]');
      await page.waitForSelector('.hero .rings', { timeout: 3000 });
      ok((await page.textContent('.hero')).includes('Safe to spend'), 'home hero shows what is safe to spend');
      ok((await page.$$('.pcard')).length === 2 && !!(await page.$('.shared-card')), 'side-by-side cards for Ravi and Meera, plus shared money');
      await shot(page, '08-home-plan');
      // edit: whose money, then a learned shortcut
      await page.click('.row >> text=Coffee');
      await page.waitForSelector('#ed-people [data-act="ed-paid"]');
      ok((await page.textContent('.sheet')).includes('Added by Ravi'), 'editor shows who added the entry');
      await shot(page, '09-editor');
      await page.click('.cat-opt >> text=Groceries');
      await page.click('[data-act="ed-save"]');
      await settle(page);
      ok((await page.textContent('#toast-root')).includes('from now on'), 'changing a category teaches a shortcut');
      await typeEntry(page, 'coffee 90');
      ok((await page.textContent('#slips')).includes('Groceries'), 'learned shortcut applied to the next entry');
      await closeBar(page);
      // example data uses the household's own names and keeps the plan
      await page.click('#open-settings');
      await page.click('[data-act="examples"]');
      await page.waitForTimeout(400);
      ok((await page.textContent('#banner')).includes('example data'), 'example banner shown');
      ok((await page.textContent('#hh-title')) === 'Ravi & Meera', 'examples keep your household');
      // insights
      await page.click('[data-tab="insights"]');
      await page.waitForSelector('.chart svg', { timeout: 3000 });
      const charts = await page.$$eval('#ins-body .chart svg', s => s.length);
      ok(charts === 3, 'insights draws three SVG charts (' + charts + ')');
      ok((await page.$$('.sbar')).length >= 3, 'who-spends-on-what bars shown');
      ok((await page.$$('.hm-c')).length >= 28, 'calendar heatmap rendered');
      await shot(page, '10-insights');
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
      // activity + search
      await page.click('[data-tab="activity"]');
      await page.waitForSelector('#act-q');
      await page.fill('#act-q', 'netflix');
      await page.waitForTimeout(100);
      ok((await page.$$eval('.row', r => r.length)) >= 2, 'search finds Netflix across months');
      await page.fill('#act-q', 'meera');
      await page.waitForTimeout(100);
      ok((await page.$$eval('.row', r => r.length)) >= 3, 'search by person name works');
      await page.fill('#act-q', '');
      await page.waitForTimeout(100);
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, '11-activity');
      // bank SMS import
      await page.click('#add-btn');
      await page.click('[data-act="import-sms"]');
      await page.fill('#imp-text', 'Rs.450.00 debited from A/c XX1234 on 28-10-26 to VPA swiggy@axisbank. UPI Ref 123456789012.\n\nINR 1,250.00 spent on your HDFC Bank Credit Card ending 1234 at AMAZON on 2026-10-27. Avl Lmt: INR 45,000');
      await page.click('[data-act="imp-read"]');
      await page.waitForSelector('.imp-row');
      ok((await page.$$('.imp-row')).length === 2, 'two bank messages read');
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
      ok((await page.$$('.imp-row')).length === 3, 'CSV rows found');
      await page.click('[data-act="imp-save"]');
      await settle(page);
      // export
      await page.click('#open-settings');
      await shot(page, '12-settings');
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act="export-csv"]')]);
      const csvOut = fs.readFileSync(await dl.path(), 'utf8');
      ok(/Date,Type,Amount/.test(csvOut) && /Paid by,For,Added by/.test(csvOut) && csvOut.split('\n').length > 50, 'CSV export includes who paid, who it was for and who added it (' + dl.suggestedFilename() + ')');
      // clear examples keeps own entries and the real plan
      await page.click('.sheet [data-act="clear-examples"]');
      await page.waitForTimeout(400);
      const left = await page.evaluate(() => { let n = 0; for (const k of Object.keys(localStorage)) if (/v1:ledger:/.test(k)) n += Object.values(JSON.parse(localStorage[k]).entries).length; return n; });
      ok(left >= 10 && left < 20, 'clearing examples keeps your own entries (' + left + ' left)');
      // backgrounds: per person, remembered
      await page.click('#open-look');
      await page.waitForSelector('.scene-tile');
      ok((await page.$$('.scene-tile')).length === 8, 'eight scenes to choose from');
      await page.click('.scene-tile[data-arg="neon"]');
      await settle(page);
      ok(await page.evaluate(() => document.body.classList.contains('tone-dark')), 'choosing a dark scene switches the glass to dark');
      await shot(page, '13-look');
      await page.keyboard.press('Escape');
      // reload persists everything
      await page.reload();
      await page.waitForFunction(() => document.getElementById('hh-title').textContent === 'Ravi & Meera', null, { timeout: 6000 });
      ok(true, 'household persists after reload');
      await page.click('[data-tab="home"]');
      await page.waitForSelector('.hero');
      ok(await page.evaluate(() => document.body.classList.contains('tone-dark')), 'background choice persists after reload');
      ok((await page.textContent('.hero')).includes('Safe to spend'), 'plan persists after reload');
      await page.waitForTimeout(500);
      await shot(page, '14-home-neon');
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(wide <= 0, 'no horizontal scrolling at phone width (' + wide + ')');
    }
  });

  await run('cloud mode (mocked runtime) · owner · en-US', {
    mock: true,
    ctx: { locale: 'en-US', timezoneId: 'America/New_York', colorScheme: 'dark', viewport: { width: 1280, height: 860 }, hasTouch: false },
    steps: async page => {
      await page.waitForSelector('.welcome', { timeout: 6000 });
      await shot(page, '20-welcome-dark-desktop');
      await typeEntry(page, 'gas 45');
      await page.press('#entry', 'Enter');
      await page.waitForSelector('.hero', { timeout: 4000 });
      ok((await page.evaluate(() => window.__aiCalls || 0)) === 1, 'unclear entry asked Claude once');
      let docs = await page.evaluate(() => JSON.parse(JSON.stringify(window.__docs)));
      const ledger = Object.keys(docs).filter(k => k.indexOf('ledger/') === 0);
      ok(ledger.length === 1, 'entry written to a month document: ' + ledger.join(','));
      const ent = ledger.length ? Object.values(docs[ledger[0]].entries)[0] : {};
      ok(ent.cat === 'transport' && ent.amount === 45 && ent.by === 'p1', 'Claude’s category stored, added by the owner: ' + JSON.stringify(ent).slice(0, 140));
      ok(!!docs['meta/settings'] && docs['meta/settings'].currency === 'USD', 'settings pinned with USD');
      ok(docs['data/users/u_test/prefs'] && docs['data/users/u_test/prefs'].me === 'p1', 'owner is remembered as the first person, privately');
      await typeEntry(page, 'coffee 4.50');
      await page.press('#entry', 'Enter');
      await page.waitForTimeout(300);
      ok((await page.evaluate(() => window.__aiCalls)) === 1, 'clear entries are parsed locally without Claude');
      await page.click('.row >> text=Coffee');
      await page.click('[data-act="ed-delete"]');
      await page.waitForFunction(() => !Array.from(document.querySelectorAll('.row')).some(r => /Coffee/.test(r.textContent)), null, { timeout: 4000 }).catch(() => {});
      ok(!(await page.$('.row >> text=Coffee')), 'deleted entry disappears');
      await page.click('#toast-root button >> text=Undo');
      await page.waitForSelector('.row >> text=Coffee', { timeout: 3000 }).catch(() => {});
      ok(!!(await page.$('.row >> text=Coffee')), 'undo brings it back');
      await typeEntry(page, 'Netflix 15.49 monthly');
      await page.press('#entry', 'Enter');
      await page.waitForTimeout(300);
      const rec = await page.evaluate(() => window.__docs['meta/recurring']);
      ok(rec && Object.keys(rec.items).length === 1, 'repeating rule saved');
      const png = path.join(SHOTS, 'receipt.png');
      fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
      await page.setInputFiles('#file-img', png);
      await page.waitForSelector('#ed-amount', { timeout: 4000 });
      ok((await page.inputValue('#ed-amount')) === '1840', 'receipt amount read into the editor');
      await page.click('[data-act="ed-save"]');
      await page.waitForTimeout(300);
      // examples bring a sample household and plan
      await page.click('#open-settings');
      await page.click('[data-act="examples"]');
      await page.waitForTimeout(600);
      docs = await page.evaluate(() => JSON.parse(JSON.stringify(window.__docs)));
      ok(docs['meta/household'] && docs['meta/household'].sample && docs['meta/plan'] && docs['meta/plan'].sample, 'example household and plan are marked as examples');
      await page.click('[data-tab="plan"]');
      await page.waitForSelector('.chart[data-chart="flow"] svg', { timeout: 3000 });
      await page.waitForTimeout(400);
      await shot(page, '21-plan-dark-desktop');
      await page.click('[data-tab="insights"]');
      await page.waitForSelector('.chart svg');
      await page.click('[data-act="ask-sugg"] >> nth=0');
      await page.waitForSelector('.a', { timeout: 3000 });
      ok((await page.textContent('#ask-log')).includes('Food & Dining'), 'answer streams into the ask card');
      await shot(page, '22-insights-dark-desktop');
      await page.click('[data-tab="home"]');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await shot(page, '23-home-dark-desktop');
      await page.click('#banner [data-act="clear-examples"]');
      await page.waitForTimeout(500);
      docs = await page.evaluate(() => JSON.parse(JSON.stringify(window.__docs)));
      ok(!(docs['meta/household'].members || []).length && !(docs['meta/plan'].fixed || []).length, 'clearing examples removes the sample household and plan');
      const size = await page.evaluate(() => Math.max(...Object.keys(window.__docs).filter(k => k.indexOf('ledger/') === 0).map(k => JSON.stringify(window.__docs[k]).length)));
      ok(size < 200000, 'largest month document stays small (' + size + ' bytes)');
    }
  });

  await run('cloud mode (mocked runtime) · invited partner', {
    mock: true,
    seed: { owner: false, uid: 'u_partner', docs: { 'meta/household': { members: [{ id: 'p1', name: 'Ravi' }, { id: 'p2', name: 'Meera' }], sharedDefault: true }, 'meta/settings': { currency: 'INR', startDay: 1, ai: 'auto', voiceAuto: false, dateOrder: 'DMY' } } },
    ctx: { locale: 'en-IN', timezoneId: 'Asia/Kolkata', colorScheme: 'dark' },
    steps: async page => {
      await page.waitForFunction(() => document.getElementById('hh-title').textContent === 'Ravi & Meera', null, { timeout: 6000 });
      await page.waitForTimeout(300);
      const prefs = await page.evaluate(() => window.__docs['data/users/u_partner/prefs']);
      ok(prefs && prefs.me === 'p2', 'an invited editor is recognised as the second person');
      ok(await page.evaluate(() => document.body.classList.contains('tone-dark') && document.getElementById('bg-fallback').style.background.length > 0), 'the partner gets their own default scene');
      await typeEntry(page, 'lunch 300');
      ok((await page.textContent('.slip-who')).includes('Meera'), 'the partner’s entries default to her');
      await page.press('#entry', 'Enter');
      await closeBar(page);
      await page.waitForSelector('.hero', { timeout: 3000 });
      const e = await page.evaluate(() => { for (const k of Object.keys(window.__docs)) if (k.indexOf('ledger/') === 0) return Object.values(window.__docs[k].entries)[0]; return null; });
      ok(e && e.who === 'p2' && e.paid === 'p2' && e.by === 'p2', 'saved to the shared ledger as hers, paid by her');
      ok(!(await page.textContent('#banner')).includes('private'), 'no private-copy banner for a household member');
      await shot(page, '30-partner');
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
    await ctx.addInitScript(() => {
      class FakeRecognition {
        start() {
          setTimeout(() => { const r = [{ transcript: 'auto 180 to the station', confidence: 0.9 }]; r.isFinal = true; if (this.onresult) this.onresult({ resultIndex: 0, results: [r] }); }, 120);
          setTimeout(() => { if (this.onend) this.onend(); }, 260);
        }
        stop() { if (this.onend) this.onend(); }
        abort() {}
      }
      window.SpeechRecognition = window.webkitSpeechRecognition = FakeRecognition;
    });
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
    // voice: tap the mic, speak, and the entry is understood and saved (speech engine stubbed)
    await page.evaluate(() => { const e = document.getElementById('entry'); e.blur(); });
    await page.waitForTimeout(500);
    await page.click('#mic-btn');
    await page.waitForFunction(() => { for (const k of Object.keys(localStorage)) if (/v1:ledger:/.test(k)) for (const e of Object.values(JSON.parse(localStorage[k]).entries)) if (e.source === 'voice') return true; return false; }, null, { timeout: 5000 }).catch(() => {});
    const spoken = await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/v1:ledger:/.test(k)) for (const e of Object.values(JSON.parse(localStorage[k]).entries)) if (e.source === 'voice') return e; return null; });
    ok(spoken && spoken.amount === 180 && spoken.cat === 'transport', 'tapping the mic and speaking saves the entry: ' + JSON.stringify(spoken && { amount: spoken.amount, cat: spoken.cat, note: spoken.note }));
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
