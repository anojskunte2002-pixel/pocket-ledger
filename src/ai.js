/* ===================== Claude: understanding entries, receipts, questions ===================== */
const AI = { fn: null, ok: false, images: false, tools: false, mediaTypes: [], maxBytes: 0, blocked: '' };

async function initAI() {
  try {
    const c = window.claude;
    if (!c || typeof c.use !== 'function') return;
    const s = await c.use('sample');
    if (!s) return;
    AI.fn = s; AI.ok = true;
    const lim = typeof s.limits === 'function' ? await s.limits().catch(() => null) : null;
    if (lim && lim.images) { AI.images = true; AI.mediaTypes = lim.images.mediaTypes || []; AI.maxBytes = lim.images.maxInputBytes || 0; }
    AI.tools = !!(lim && lim.tools);
  } catch (e) { AI.ok = false; }
  render();
}
function aiReady() { return AI.ok && !AI.blocked && settings().ai !== 'off'; }
const AI_HIDE = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];
function aiErrorText(e) {
  const code = e && e.code;
  if (code === 'not_granted') return 'Claude access is off for this page. Turn it on from the page’s Permissions menu to use smart features.';
  if (code === 'sampling_disabled') return 'Claude isn’t available on this account, so smart features are off.';
  if (code === 'rate_limited') return 'Claude is busy or your usage limit is reached. Try again in a minute.';
  if (code === 'session_expired') return 'Sign in to Claude again to use smart features.';
  if (code === 'image_rejected') return 'That image couldn’t be read. Try a clearer JPG or PNG photo.';
  if (code === 'images_unavailable') return 'Reading photos isn’t available here.';
  if (code === 'refused' || code === 'empty_completion' || code === 'invalid_json') return 'Claude couldn’t make sense of that. Try rephrasing it.';
  if (code === 'prompt_too_large') return 'That is too much text at once. Try a shorter piece.';
  if (code === 'cancelled') return '';
  return 'Couldn’t reach Claude just now. Check your connection and try again.';
}
function aiNoteError(e) {
  if (e && AI_HIDE.indexOf(e.code) >= 0) { AI.blocked = e.code; render(); }
  if (e && e.code === 'images_unavailable') { AI.images = false; render(); }
}
function catLines(cats) {
  const ex = cats.filter(c => c.type === 'expense' && !c.hidden).map(c => c.id + ' = ' + c.name).join('; ');
  const inc = cats.filter(c => c.type === 'income' && !c.hidden).map(c => c.id + ' = ' + c.name).join('; ');
  return 'Expense category ids: ' + ex + '.\nIncome category ids: ' + inc + '.';
}
const ENTRY_SHAPE = '{"entries":[{"type":"expense","amount":120,"category":"food","date":"2026-01-31","note":"Coffee","merchant":"Starbucks","method":"UPI","repeat":"none"}]}';
const ENTRY_RULES = [
  '- amount: a positive number in the ledger currency. Read shorthand like 25k = 25000, 1.5 lakh = 150000, 2 cr = 20000000. Never convert between currencies.',
  '- type: "income" for money received (salary, refunds, cashback, gifts received, selling something, interest), otherwise "expense".',
  '- Paying a credit card bill, moving money between own accounts, ATM withdrawals and lending money use category "transfer". SIPs, deposits and investments use "invest".',
  '- note: 1 to 5 words saying what it was, in sentence case, without the amount or the date. merchant: the shop, app or person if named, else "".',
  '- method: one of Cash, UPI, Card, Credit Card, Bank Transfer, Wallet if mentioned, else "".',
  '- repeat: "weekly", "monthly" or "yearly" only if it says it repeats, else "none".'
].join('\n');

async function aiParseText(text, signal) {
  const ctx = parseCtx();
  const prompt = [
    'Turn this note about money into entries for a personal finance ledger.',
    'Today is ' + fmtDate(ctx.today, { weekday: 'long' }) + ' ' + ctx.today + '. Ledger currency: ' + FMT.cur + '. Dates written with numbers are ' + (ctx.dateOrder === 'MDY' ? 'month first' : 'day first') + '.',
    catLines(ctx.cats),
    '',
    'Note: """' + String(text).slice(0, 4000) + '"""',
    '',
    'Reply with only JSON in this shape: ' + ENTRY_SHAPE,
    'Rules:',
    '- One entry per separate payment or receipt of money. If the note mentions no amount of money, reply {"entries":[]}.',
    '- date: YYYY-MM-DD; resolve words like yesterday or last Friday from today; use today when no date is given.',
    ENTRY_RULES
  ].join('\n');
  const res = await AI.fn.json(prompt, { modelTier: 'quick', signal });
  return draftsFromAI(res, ctx);
}

async function prepareImage(file) {
  const okType = !AI.mediaTypes.length || AI.mediaTypes.indexOf(file.type) >= 0;
  const okSize = !AI.maxBytes || file.size <= AI.maxBytes;
  if (okType && okSize) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * scale); cv.height = Math.round(bmp.height * scale);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  return await new Promise((res, rej) => cv.toBlob(b => (b ? res(b) : rej({ code: 'image_rejected' })), 'image/jpeg', 0.88));
}
async function aiReadImage(file, signal) {
  const ctx = parseCtx();
  const img = await prepareImage(file);
  const prompt = [
    'The image is a receipt, bill, invoice, order confirmation, or a payment screenshot from a UPI, bank, card or wallet app.',
    'Extract the money that moved, for a personal finance ledger.',
    'Today is ' + ctx.today + '. Ledger currency: ' + FMT.cur + '.',
    catLines(ctx.cats),
    '',
    'Reply with only JSON in this shape: ' + ENTRY_SHAPE.slice(0, -1) + ',"currency":"INR"}',
    'Rules:',
    '- Use the final total actually paid (after tax, tip and discounts), not subtotals or single line items. A single receipt is one entry.',
    '- date: the transaction date printed on the image as YYYY-MM-DD; if none is visible, use today.',
    '- currency: the ISO code shown on the image, or "" if unclear.',
    '- A screenshot showing money received is type "income".',
    '- If no payment is visible, reply {"entries":[]}.',
    ENTRY_RULES
  ].join('\n');
  const res = await AI.fn.json(prompt, { modelTier: 'quick', images: [img], signal });
  const drafts = draftsFromAI(res, ctx);
  const cur = res && typeof res.currency === 'string' ? res.currency.toUpperCase() : '';
  return { drafts, foreign: cur && /^[A-Z]{3}$/.test(cur) && cur !== FMT.cur ? cur : '' };
}

/* ---------- questions about the ledger ---------- */
function toolQuery(input) {
  const from = isYMD(String(input.from || '')) ? String(input.from) : '0000-01-01';
  const to = isYMD(String(input.to || '')) ? String(input.to) : '9999-12-31';
  const type = input.type === 'income' || input.type === 'expense' ? input.type : '';
  const catQ = String(input.category || '').trim().toLowerCase();
  const text = String(input.text || '').trim().toLowerCase();
  const cats = allCats();
  const catIds = catQ ? cats.filter(c => c.id === catQ || c.name.toLowerCase().indexOf(catQ) >= 0).map(c => c.id) : null;
  const rows = sortedEntries().filter(e => e.date >= from && e.date <= to && (!type || e.type === type) && (!catIds || catIds.indexOf(e.cat) >= 0) &&
    (!text || (e.note + ' ' + e.merchant + ' ' + e.tags.join(' ') + ' ' + catById(e.cat, e.type).name).toLowerCase().indexOf(text) >= 0));
  const byCat = {};
  for (const e of rows) { const n = catById(e.cat, e.type).name; byCat[n] = round2((byCat[n] || 0) + e.amount); }
  const lim = clamp(parseInt(input.limit, 10) || 40, 1, 80);
  return {
    count: rows.length,
    total_spent: round2(sum(rows.filter(e => kindOf(e) === 'spend'), e => e.amount)),
    total_income: round2(sum(rows.filter(e => e.type === 'income'), e => e.amount)),
    total_invested: round2(sum(rows.filter(e => kindOf(e) === 'invest'), e => e.amount)),
    by_category: byCat,
    entries: rows.slice(0, lim).map(e => ({ date: e.date, type: e.type, amount: e.amount, category: catById(e.cat, e.type).name, note: e.note, merchant: e.merchant, method: e.method }))
  };
}
function toolPeriods(input) {
  const n = clamp(parseInt(input.count, 10) || 6, 1, 24);
  const sd = settings().startDay, key = periodKeyFor(todayStr(), sd), list = sortedEntries();
  const out = [];
  for (let k = n - 1; k >= 0; k--) {
    const p = periodFromKey(shiftKey(key, -k), sd), s = periodStats(p, list);
    const top = Array.from(s.byCat.entries()).filter(([, v]) => v.kind === 'spend').sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([id, v]) => catById(id).name + ' ' + round2(v.total));
    out.push({ start: p.start, end: p.end, spent: round2(s.spend), income: round2(s.income), invested: round2(s.invest), top_categories: top });
  }
  return out;
}
const ASK_TOOLS = [
  { name: 'query_entries', description: 'Search the ledger. Returns matching entry count, totals (spent, income, invested), totals by category, and up to `limit` entries newest first. All filters are optional.',
    inputSchema: { type: 'object', properties: { from: { type: 'string', description: 'YYYY-MM-DD inclusive' }, to: { type: 'string', description: 'YYYY-MM-DD inclusive' }, type: { type: 'string', enum: ['expense', 'income'] }, category: { type: 'string', description: 'category id or name' }, text: { type: 'string', description: 'words to find in the note, merchant or tags' }, limit: { type: 'number' } } },
    execute: toolQuery },
  { name: 'period_totals', description: 'Totals per budget period (month) for the most recent `count` periods: spent, income, invested and the top spending categories.',
    inputSchema: { type: 'object', properties: { count: { type: 'number' } } },
    execute: toolPeriods }
];
function askPrimer(A) {
  return [
    'You are the money analyst inside Pocket Ledger, a personal finance tracker. The person asking owns this data.',
    'Answer using the summary below and, when you need detail, the tools. Use exact numbers from the data; format money in ' + FMT.cur + ' like ' + money(1234.5) + '.',
    'Keep answers short: two to six sentences, or a few bullet points. When you suggest something, base it on their real numbers. If the data can’t answer, say what they would need to log. Never invent entries.',
    'Spending excludes investments and transfers such as card bill payments and ATM withdrawals.',
    '',
    'Ledger summary:',
    buildDigest(A)
  ].join('\n');
}
async function aiAsk(turns, A, onText, signal) {
  const input = [{ role: 'user', content: askPrimer(A) }].concat(turns);
  const opts = { modelTier: 'quick', cache: false, onText, signal };
  if (AI.tools) { opts.tools = ASK_TOOLS; delete opts.cache; }
  return AI.fn(input, opts);
}
async function aiReview(A, onText, signal, refresh) {
  const prompt = [
    'Write a short money review of this period for the person who owns this ledger, using only the data below.',
    'Format: one bold headline sentence, then 3 to 5 bullet points (what changed against usual, the biggest categories, budget status, anything unusual, savings rate), then a line starting with **Next month:** and two or three concrete suggestions with numbers.',
    'Under 170 words. Money in ' + FMT.cur + ' formatted like ' + money(1234) + '. Plain, friendly language. No preamble.',
    '',
    buildDigest(A)
  ].join('\n');
  return AI.fn(prompt, { onText, signal, cache: refresh ? { gcTime: 864e5, refresh: true } : { gcTime: 864e5 } });
}

/* light markdown → safe HTML for answers */
function mdLite(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  let html = '', list = '';
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,!?]|$)/g, '$1<em>$2</em>');
  const close = () => { if (list) { html += '</' + list + '>'; list = ''; } };
  for (const raw of lines) {
    const l = raw.trim();
    let m;
    if (!l) { close(); continue; }
    if ((m = /^[-•*]\s+(.*)$/.exec(l))) { if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; } html += '<li>' + inline(m[1]) + '</li>'; continue; }
    if ((m = /^\d+[.)]\s+(.*)$/.exec(l))) { if (list !== 'ol') { close(); html += '<ol>'; list = 'ol'; } html += '<li>' + inline(m[1]) + '</li>'; continue; }
    close();
    if ((m = /^#{1,4}\s+(.*)$/.exec(l))) { html += '<p><strong>' + inline(m[1]) + '</strong></p>'; continue; }
    html += '<p>' + inline(l) + '</p>';
  }
  close();
  return html;
}
