/* ===================== sheets (dialogs) ===================== */
const SHEET = { onClose: null, prevFocus: null, open: false };
function openSheet(html, opts) {
  opts = opts || {};
  closeSheet(true);
  hideTip();
  const root = $('#sheet-root');
  root.innerHTML = '<div class="scrim" data-act="close-sheet"></div><div class="sheet' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || 'Dialog') + '">' + html + '</div>';
  root.hidden = false;
  document.body.classList.add('sheet-open');
  SHEET.onClose = opts.onClose || null;
  if (!SHEET.open) SHEET.prevFocus = document.activeElement;
  SHEET.open = true;
  const sheet = root.querySelector('.sheet');
  if (opts.onMount) opts.onMount(sheet);
  requestAnimationFrame(() => {
    const f = sheet.querySelector('[autofocus]') || sheet.querySelector('.sh-head .icon-btn');
    if (f) try { f.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  });
  return sheet;
}
function closeSheet(silent) {
  if (!SHEET.open) return;
  const cb = SHEET.onClose;
  SHEET.onClose = null; SHEET.open = false;
  const root = $('#sheet-root');
  root.innerHTML = ''; root.hidden = true;
  document.body.classList.remove('sheet-open');
  if (cb) { try { cb(); } catch (e) { /* ignore */ } }
  if (silent !== true && SHEET.prevFocus && SHEET.prevFocus.isConnected) { try { SHEET.prevFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
}
function sheetHead(title) { return '<header class="sh-head"><h2>' + esc(title) + '</h2><button type="button" class="icon-btn" data-act="close-sheet" aria-label="Close">' + ICON.x + '</button></header>'; }

/* ---------- entry editor ---------- */
let ED = null;
function evalAmount(s) {
  let t = String(s || '').replace(/[,\s₹$€£¥]/g, '').replace(/[x×]/gi, '*').replace(/÷/g, '/');
  t = t.replace(/(\d+(?:\.\d+)?)k/gi, '($1*1000)').replace(/(\d+(?:\.\d+)?)(?:lakhs?|lacs?|l)/gi, '($1*100000)');
  if (!t) return 0;
  if (!/^[\d.+\-*/()]+$/.test(t)) return parseFloat(t) || 0;
  let i = 0;
  const peek = () => t[i];
  const num = () => { const st = i; while (i < t.length && /[\d.]/.test(t[i])) i++; return parseFloat(t.slice(st, i)); };
  const factor = () => { if (peek() === '(') { i++; const v = expr(); if (peek() === ')') i++; return v; } if (peek() === '-') { i++; return -factor(); } return num(); };
  const term = () => { let v = factor(); while (peek() === '*' || peek() === '/') { const op = t[i++]; const r = factor(); v = op === '*' ? v * r : v / r; } return v; };
  function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const op = t[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; }
  const v = expr();
  return Number.isFinite(v) && v > 0 ? round2(v) : 0;
}
function catGridHTML(type, sel) {
  return allCats().filter(c => c.type === type && (!c.hidden || c.id === sel)).map(c => '<button type="button" class="cat-opt" data-act="ed-cat" data-arg="' + esc(c.id) + '" aria-pressed="' + (c.id === sel) + '"><span class="em" aria-hidden="true">' + esc(c.emoji) + '</span>' + esc(c.name) + '</button>').join('');
}
function openEditor(src, opts) {
  opts = opts || {};
  const existing = src && src.id && Store.entries.get(src.id);
  const base = { type: 'expense', amount: 0, cat: '', date: todayStr(), note: '', merchant: '', method: '', repeat: '', tags: [], who: '' };
  const d = Object.assign(base, JSON.parse(JSON.stringify(existing || src || {})));
  d.who = existing ? whoOf(existing) : (d.who || defaultWhoFor(d.cat));
  ED = { isNew: !existing, orig: existing || null, d, autoCat: d.cat, catTouched: false, whoTouched: !!(src && src.who), foreign: opts.foreign || '', source: d.source || 'manual', raw: opts.raw || '' };
  openSheet(editorHTML(), { label: ED.isNew ? 'New entry' : 'Edit entry', onMount: bindEditor });
}
function editorHTML() {
  const d = ED.d, isNew = ED.isNew;
  const rec = !isNew && ED.orig && ED.orig.rec ? recurringItems()[ED.orig.rec] : null;
  const reps = [['', 'Never'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']];
  return sheetHead(isNew ? 'New entry' : 'Edit entry') + '<div class="sh-body">' +
    (ED.foreign ? '<p class="note-box">The receipt shows ' + esc(ED.foreign) + ' and your ledger uses ' + esc(FMT.cur) + '. Check the amount before you save.</p>' : '') +
    '<div class="seg" role="radiogroup" aria-label="Money in or out" style="margin-top:4px">' +
    '<button type="button" role="radio" data-act="ed-type" data-arg="expense" aria-checked="' + (d.type === 'expense') + '">Money out</button>' +
    '<button type="button" role="radio" data-act="ed-type" data-arg="income" aria-checked="' + (d.type === 'income') + '">Money in</button></div>' +
    '<label class="amt-field"><span class="cur" aria-hidden="true">' + esc(curSymbol()) + '</span><span class="sr">Amount</span><input id="ed-amount" inputmode="decimal" autocomplete="off" placeholder="0" value="' + (d.amount ? esc(String(d.amount)) : '') + '"' + (isNew && !d.amount ? ' autofocus' : '') + '></label>' +
    '<p class="calc" id="ed-calc">Sums work too, like 120+80.</p>' +
    '<label class="field"><span>What was it?</span><input id="ed-note" maxlength="120" autocomplete="off" value="' + esc(d.note) + '" placeholder="Coffee with Sam"></label>' +
    '<div class="field"><span>Category</span><div class="cat-grid" id="ed-cats">' + catGridHTML(d.type, d.cat) + '</div></div>' +
    (household().solo ? '' : '<div class="field"><span>Whose money</span><div class="who-pick" id="ed-who" role="radiogroup" aria-label="Whose money">' + whoPickHTML('ed-who', d.who) + '</div></div>') +
    '<div class="row2"><label class="field"><span>Date</span><input type="date" id="ed-date" value="' + esc(d.date) + '"></label>' +
    '<label class="field"><span>Place or person</span><input id="ed-merchant" maxlength="60" autocomplete="off" value="' + esc(d.merchant) + '" placeholder="Optional"></label></div>' +
    '<div class="field"><span>Paid with</span><div class="chips" id="ed-methods">' + METHODS.map(m => '<button type="button" class="chip-btn" data-act="ed-method" data-arg="' + esc(m) + '" aria-pressed="' + (d.method === m) + '">' + esc(m) + '</button>').join('') + '</div></div>' +
    (isNew ? '<div class="field"><span>Repeats</span><div class="chips" id="ed-repeat">' + reps.map(r => '<button type="button" class="chip-btn" data-act="ed-repeat" data-arg="' + r[0] + '" aria-pressed="' + ((d.repeat || '') === r[0]) + '">' + r[1] + '</button>').join('') + '</div></div>'
      : rec ? '<p class="cc-sub" style="margin-top:14px">This came from an entry that repeats ' + esc(rec.every) + '. Change or stop it in Settings, under Repeating entries.</p>' : '') +
    '<label class="field"><span>Tags</span><input id="ed-tags" autocomplete="off" value="' + esc((d.tags || []).map(t => '#' + t).join(' ')) + '" placeholder="#trip #work"></label>' +
    (!isNew && ED.orig ? byLineHTML(ED.orig) : '') +
    '</div><footer class="sh-foot">' + (isNew ? '' : '<button type="button" class="btn ghost danger" data-act="ed-delete">Delete</button><button type="button" class="btn ghost" data-act="ed-duplicate">Duplicate</button>') +
    '<span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="button" class="btn primary" data-act="ed-save">' + (isNew ? 'Add' : 'Save') + '</button></footer>';
}
function bindEditor(sheet) {
  const amt = $('#ed-amount', sheet), calc = $('#ed-calc', sheet);
  const show = () => {
    calc.classList.remove('err');
    const v = evalAmount(amt.value);
    calc.textContent = /[+*/x×()]|\d-\d/.test(amt.value) && v ? '= ' + money(v) : 'Sums work too, like 120+80.';
  };
  amt.addEventListener('input', show);
  for (const id of ['#ed-amount', '#ed-note', '#ed-merchant', '#ed-tags']) $(id, sheet).addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); editorSave(); } });
}
function readEditor() {
  const d = ED.d;
  d.amount = evalAmount($('#ed-amount').value);
  d.note = $('#ed-note').value.trim();
  const dv = $('#ed-date').value;
  if (isYMD(dv)) d.date = dv;
  d.merchant = $('#ed-merchant').value.trim();
  d.tags = ($('#ed-tags').value.match(/#?[A-Za-z0-9_-]+/g) || []).map(t => t.replace(/^#/, '').toLowerCase()).slice(0, 8);
  return d;
}
async function editorSave() {
  if (!ED) return;
  const d = readEditor();
  if (!(d.amount > 0)) { const c = $('#ed-calc'); c.textContent = 'Enter an amount above zero.'; c.classList.add('err'); $('#ed-amount').focus(); return; }
  if (!d.cat || catById(d.cat, d.type).type !== d.type) {
    const guess = catFromText(d.note + ' ' + d.merchant, d.type, parseCtx());
    d.cat = guess.cat;
  }
  if (!d.note) d.note = d.merchant || catById(d.cat, d.type).name;
  if (ED.isNew) {
    const raw = ED.raw;
    const src = ED.source;
    const drafts = [Object.assign({}, d, { catLocked: ED.catTouched && d.cat !== ED.autoCat, source: src })];
    closeSheet();
    const saved = await saveDrafts(drafts, src);
    if (saved.length && raw) {
      const el = $('#entry');
      if (el.value.indexOf(raw) >= 0) { el.value = el.value.replace(raw, '').replace(/^[\s,;&]+|[\s,;&]+$/g, '').replace(/^(?:and|plus)\s+|\s+(?:and|plus)$/i, ''); onEntryInput(); }
    }
  } else {
    const prev = ED.orig;
    closeSheet();
    await updateEntry(prev, { type: d.type, amount: d.amount, cat: d.cat, date: d.date, note: d.note, merchant: d.merchant, method: d.method, tags: d.tags, who: d.who || prev.who });
  }
}

/* ---------- category picker for the preview slips ---------- */
function openCatPicker(cur, onPick) {
  const sec = t => allCats().filter(c => c.type === t && !c.hidden).map(c => '<button type="button" class="cat-opt" data-pick="' + esc(c.id) + '" aria-pressed="' + (c.id === cur) + '"><span class="em" aria-hidden="true">' + esc(c.emoji) + '</span>' + esc(c.name) + '</button>').join('');
  openSheet(sheetHead('Choose a category') + '<div class="sh-body"><p class="lbl-s">Money out</p><div class="cat-grid" style="margin-top:6px">' + sec('expense') + '</div>' +
    '<p class="lbl-s" style="margin-top:18px">Money in</p><div class="cat-grid" style="margin-top:6px">' + sec('income') + '</div>' +
    '<p class="cc-sub" style="margin-top:16px">I’ll remember this choice for similar entries.</p></div>', {
    label: 'Choose a category', wide: true,
    onMount: sh => sh.addEventListener('click', ev => { const b = ev.target.closest('[data-pick]'); if (b) { const id = b.dataset.pick; closeSheet(true); onPick(id); } })
  });
}

/* ---------- ways to add ---------- */
function openAddHub() {
  const tiles = [
    ['camera', 'Snap a receipt', 'Photos, bills and payment screenshots', 'scan', aiReady() && AI.images],
    ['mic', 'Say it', 'Talk the way you’d text it', 'voice', true],
    ['message', 'Paste bank messages', 'SMS or e-mail alerts, many at once', 'import-sms', true],
    ['file', 'Import a statement', 'A CSV file from your bank or card', 'import-csv', true],
    ['pencil', 'Fill in a form', 'Choose every detail yourself', 'new-entry', true],
    ['plan', 'Plan income or a bill', 'Salary, rent, EMIs, sending home', 'plan-new-fixed', true],
    ['repeat', 'Add a repeating entry', 'Subscriptions and other regulars', 'new-repeat', true]
  ].filter(t => t[4]);
  openSheet(sheetHead('Add money in or out') + '<div class="sh-body"><p class="sh-lede">The quickest way is the box at the bottom. Type or say it like a text message.</p>' +
    '<div class="hub" style="margin-top:14px">' + tiles.map(t => '<button type="button" class="way" data-act="' + t[3] + '">' + ic(t[0]) + '<b>' + t[1] + '</b><span>' + t[2] + '</span></button>').join('') + '</div></div>', { label: 'Ways to add', wide: true });
}

/* ---------- receipts and screenshots ---------- */
function readAsDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
async function handleImage(file) {
  if (!file) return;
  if (!/^image\//.test(file.type || '')) { toast('That file isn’t an image. Choose a photo or screenshot.'); return; }
  if (!(aiReady() && AI.images)) { toast(AI.ok ? 'Reading photos needs Claude access, which is off right now.' : 'Reading photos needs Claude, which isn’t available in this view.'); return; }
  const ctl = new AbortController();
  let url = '';
  try { url = await readAsDataURL(file); } catch (e) { /* preview is optional */ }
  openSheet(sheetHead('Reading your receipt') + '<div class="sh-body"><div class="scan">' + (url ? '<img src="' + esc(url) + '" alt="The image you chose">' : '') + '<div class="scanline"></div></div>' +
    '<p class="sh-lede" id="scan-status" style="margin-top:12px">Claude is looking for the total, the date and the shop…</p></div>', { label: 'Reading receipt', onClose: () => ctl.abort() });
  try {
    const res = await aiReadImage(file, ctl.signal);
    if (ctl.signal.aborted) return;
    if (!res.drafts.length) { const s = $('#scan-status'); if (s) s.textContent = 'I couldn’t find a payment in that image. Try a sharper photo, or type it in the box below.'; const l = $('.scanline'); if (l) l.remove(); return; }
    const ds = res.drafts.map(d => Object.assign(d, { source: 'receipt' }));
    closeSheet(true);
    if (ds.length === 1) openEditor(ds[0], { foreign: res.foreign });
    else openImportDrafts(ds, 'receipt');
  } catch (e) {
    aiNoteError(e);
    if (e && e.code === 'cancelled') return;
    const s = $('#scan-status');
    if (s) s.textContent = aiErrorText(e) || 'That didn’t work. Try again.';
    const l = $('.scanline'); if (l) l.remove();
  }
}

/* ---------- import: bank messages, CSV statements, backups ---------- */
const IMP = { tab: 'sms', text: '', drafts: [], picked: [], dup: [], csv: null, backup: null, source: '' };
function openImport(tab, text) {
  Object.assign(IMP, { tab: tab || 'sms', text: text || '', drafts: [], picked: [], dup: [], csv: null, backup: null, source: '' });
  openSheet(sheetHead(tab === 'preview' ? 'Check and add' : 'Import entries') + '<div class="sh-body" id="imp-body"></div><footer class="sh-foot" id="imp-foot"></footer>', {
    label: 'Import entries', wide: true,
    onMount: () => { renderImport(); if (IMP.text && IMP.tab === 'sms') importRead(); }
  });
}
function openImportDrafts(drafts, source) { openImport('preview'); IMP.drafts = drafts; IMP.source = source; markDups(); renderImport(); }
function markDups() {
  const idx = new Map();
  for (const e of Store.entries.values()) { const k = e.type + '|' + Math.round(e.amount * 100); if (!idx.has(k)) idx.set(k, []); idx.get(k).push(e.date); }
  const seen = new Map();
  IMP.dup = IMP.drafts.map(d => {
    const k = d.type + '|' + Math.round(d.amount * 100);
    const a = idx.get(k);
    const inLedger = !!(a && a.some(x => Math.abs(daysBetween(x, d.date)) <= 1));
    const sk = k + '|' + d.date + '|' + normText(d.note).trim();
    const inBatch = seen.has(sk);
    seen.set(sk, true);
    return inLedger || inBatch;
  });
  IMP.picked = IMP.dup.map(x => !x);
}
function catOptions(type, sel) {
  return allCats().filter(c => c.type === type && (!c.hidden || c.id === sel)).map(c => '<option value="' + esc(c.id) + '"' + (c.id === sel ? ' selected' : '') + '>' + esc(c.emoji + '  ' + c.name) + '</option>').join('');
}
function importPreviewHTML() {
  const n = IMP.picked.filter(Boolean).length, dups = IMP.dup.filter(Boolean).length;
  let h = '<div class="imp-sum"><span>' + plural(IMP.drafts.length, 'entry', 'entries') + ' found' + (dups ? ' · ' + plural(dups, 'possible duplicate') + ' left unticked' : '') + '</span>' +
    '<span><button type="button" class="link" data-act="imp-all">Select all</button> · <button type="button" class="link" data-act="imp-none">None</button></span></div>';
  IMP.drafts.forEach((d, i) => {
    const meta = [dayLabel(d.date)];
    if (d.method) meta.push(d.method);
    h += '<div class="imp-row"><input type="checkbox" data-imp-i="' + i + '"' + (IMP.picked[i] ? ' checked' : '') + ' aria-label="Include ' + esc(d.note) + '">' +
      '<span class="imp-main"><span class="imp-note">' + esc(d.note) + '</span><span class="imp-meta">' + esc(meta.join(' · ')) + (IMP.dup[i] ? ' · <span class="dup">Looks like a duplicate</span>' : '') + '</span></span>' +
      '<span class="imp-amt' + (d.type === 'income' ? ' in' : '') + '">' + esc((d.type === 'income' ? '+' : '') + money(d.amount)) + '</span>' +
      '<select data-imp-cat="' + i + '" aria-label="Category for ' + esc(d.note) + '">' + catOptions('expense', d.cat).replace(/^/, '<optgroup label="Money out">') + '</optgroup><optgroup label="Money in">' + catOptions('income', d.cat) + '</optgroup></select></div>';
  });
  return h;
}
function renderImportFoot() {
  const foot = $('#imp-foot');
  if (!foot) return;
  if (IMP.drafts.length) {
    const sel = IMP.drafts.filter((d, i) => IMP.picked[i]);
    const out = sum(sel.filter(d => d.type === 'expense'), d => d.amount), inc = sum(sel.filter(d => d.type === 'income'), d => d.amount);
    foot.innerHTML = '<span class="muted">' + esc((out ? money(out) + ' out' : '') + (out && inc ? ' · ' : '') + (inc ? money(inc) + ' in' : '')) + '</span><span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="button" class="btn primary" data-act="imp-save"' + (sel.length ? '' : ' disabled') + '>Add ' + plural(sel.length, 'entry', 'entries') + '</button>';
  } else if (IMP.tab === 'backup' && IMP.backup && !IMP.backup.error) {
    foot.innerHTML = '<span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="button" class="btn primary" data-act="imp-restore">Restore</button>';
  } else foot.innerHTML = '<span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Close</button>';
}
function renderImport() {
  const body = $('#imp-body');
  if (!body) return;
  let h = '';
  if (IMP.tab !== 'preview') h += '<div class="seg imp-tabs" role="radiogroup" aria-label="What to import">' + [['sms', 'Bank messages'], ['csv', 'Statement file'], ['backup', 'Backup']].map(t => '<button type="button" role="radio" data-act="imp-tab" data-arg="' + t[0] + '" aria-checked="' + (IMP.tab === t[0]) + '">' + t[1] + '</button>').join('') + '</div>';
  if (IMP.tab === 'sms') {
    h += '<label class="field"><span>Paste bank SMS or e-mail alerts, one or many</span><textarea id="imp-text" placeholder="Rs.450.00 debited from A/c XX1234 on 28-10-26 to VPA swiggy@axisbank. UPI Ref 1234…">' + esc(IMP.text) + '</textarea></label>' +
      '<div class="welcome-cta"><button type="button" class="btn" data-act="imp-read">Find entries</button><span class="muted">Balances, OTPs and offers are ignored.</span></div>';
  } else if (IMP.tab === 'csv') {
    h += '<p class="sh-lede" style="margin-top:14px">Download a CSV statement from your bank or card website and choose it here. I’ll find the date, amount and description columns and sort each row into a category.</p>' +
      '<div class="welcome-cta"><button type="button" class="btn" data-act="imp-file">' + ic('upload') + 'Choose a CSV file</button>' + (IMP.csv ? '<span class="muted">' + esc(IMP.csv.name) + '</span>' : '') + '</div>';
    if (IMP.csv && IMP.csv.error) h += '<p class="note-box">' + esc(IMP.csv.error) + '</p>';
    if (IMP.csv && IMP.csv.signedHint && IMP.drafts.length) h += '<div class="field"><span>Positive amounts in this file are</span><div class="seg"><button type="button" role="radio" data-act="imp-sign" data-arg="exp" aria-checked="' + !!IMP.csv.positiveIsExpense + '">Spending</button><button type="button" role="radio" data-act="imp-sign" data-arg="inc" aria-checked="' + !IMP.csv.positiveIsExpense + '">Income</button></div></div>';
  } else if (IMP.tab === 'backup') {
    h += '<p class="sh-lede" style="margin-top:14px">Restore a Pocket Ledger backup file. Entries you already have stay as they are; missing ones are added back.</p>' +
      '<div class="welcome-cta"><button type="button" class="btn" data-act="imp-json">' + ic('upload') + 'Choose a backup file</button></div>';
    const b = IMP.backup;
    if (b && b.error) h += '<p class="note-box">' + esc(b.error) + '</p>';
    else if (b) h += '<p class="sh-lede" style="margin-top:14px">The backup holds ' + plural(b.total, 'entry', 'entries') + (b.obj.exported ? ' from ' + esc(String(b.obj.exported).slice(0, 10)) : '') + '. ' + plural(b.fresh.length, 'entry', 'entries') + (b.fresh.length === 1 ? ' is' : ' are') + ' new here.</p>' +
      '<label class="switch"><input type="checkbox" id="imp-meta"' + (b.withMeta ? ' checked' : '') + '><span>Also restore settings, budgets, categories, repeating entries and learned shortcuts</span></label>';
  }
  if (IMP.drafts.length) h += importPreviewHTML();
  body.innerHTML = h;
  const ta = $('#imp-text');
  if (ta) ta.addEventListener('input', () => { IMP.text = ta.value; });
  const mt = $('#imp-meta');
  if (mt) mt.addEventListener('change', () => { IMP.backup.withMeta = mt.checked; });
  body.onchange = ev => {
    const t = ev.target;
    if (t.matches('[data-imp-i]')) { IMP.picked[+t.dataset.impI] = t.checked; renderImportFoot(); }
    else if (t.matches('[data-imp-cat]')) { const d = IMP.drafts[+t.dataset.impCat]; d.cat = t.value; d.type = catById(t.value).type; d.catLocked = true; renderImport(); }
  };
  renderImportFoot();
}
function importRead() {
  const text = IMP.text.trim();
  if (!text) { toast('Paste a message first'); return; }
  const ctx = parseCtx();
  let ds = parseBankMessages(text, ctx);
  if (!ds.length) { const r = parseText(text, ctx); ds = r.kind === 'entries' ? r.entries.filter(d => d.amount > 0) : []; }
  IMP.drafts = ds.map(d => Object.assign(d, { source: 'sms' }));
  IMP.source = 'sms';
  markDups();
  renderImport();
  if (!ds.length) toast('No payments found in that text');
}
async function readCSVFile(file) {
  let text = '';
  try { text = await file.text(); } catch (e) { IMP.csv = { name: file.name, error: 'That file couldn’t be read.' }; renderImport(); return; }
  const rows = parseCSV(text);
  const res = csvToDrafts(rows, parseCtx());
  IMP.csv = { name: file.name, rows, error: res.error || (res.drafts.length ? '' : 'No rows with both a date and an amount were found.'), positiveIsExpense: res.positiveIsExpense, signedHint: !!(res.map && res.map.amount != null && res.map.debit == null && res.map.credit == null && res.map.type == null) };
  IMP.drafts = res.drafts.map(d => Object.assign(d, { source: 'csv' }));
  IMP.source = 'csv';
  markDups();
  renderImport();
}
function rerunCSV(positiveIsExpense) {
  if (!IMP.csv || !IMP.csv.rows) return;
  const res = csvToDrafts(IMP.csv.rows, parseCtx(), { positiveIsExpense });
  IMP.csv.positiveIsExpense = positiveIsExpense;
  IMP.drafts = res.drafts.map(d => Object.assign(d, { source: 'csv' }));
  markDups();
  renderImport();
}
async function readBackupFile(file) {
  let obj = null;
  try { obj = JSON.parse(await file.text()); } catch (e) { obj = null; }
  if (!obj || obj.app !== 'pocket-ledger' || !Array.isArray(obj.entries)) { IMP.backup = { error: 'That file isn’t a Pocket Ledger backup.' }; renderImport(); return; }
  const fresh = obj.entries.filter(x => x && typeof x.id === 'string' && /^[\w.~:@+-]{1,120}$/.test(x.id) && !Store.entries.has(x.id));
  IMP.backup = { obj, fresh, total: obj.entries.length, withMeta: !Store.entries.size };
  renderImport();
}
async function importSave() {
  const ds = IMP.drafts.filter((d, i) => IMP.picked[i]);
  if (!ds.length) return;
  const src = IMP.source || 'import';
  closeSheet(true);
  const saved = await saveDrafts(ds.map(d => Object.assign({}, d, { repeat: '', source: d.source || src })), src, true);
  if (saved.length) toast('Added ' + plural(saved.length, 'entry', 'entries'), [{ label: 'Undo', run: async () => { try { await deleteEntries(saved.map(e => e.id)); toast('Removed'); } catch (e) { toast(storeErrorText(e)); } } }], 7000);
}
async function restoreBackup() {
  const b = IMP.backup;
  if (!b || b.error) return;
  const list = b.fresh.map(x => normEntry(x.id, x));
  try {
    if (list.length) await putEntries(list);
    if (b.withMeta) for (const n of META_NAMES) if (b.obj[n] && typeof b.obj[n] === 'object') { const d = Object.assign({}, b.obj[n]); delete d.rev; await putMeta(n, d); }
  } catch (e) { toast(storeErrorText(e)); return; }
  closeSheet(true);
  toast('Restored ' + plural(list.length, 'entry', 'entries'));
}

/* ---------- budgets ---------- */
function openBudgetEditor(id) {
  const b = budgets(), A = analyze(UI.period);
  const c = id ? catById(id) : null;
  const cur = id ? b.cats[id] : b.total;
  const usual = id ? (A.avgCat.get(id) || 0) : A.avgSpend;
  openSheet(sheetHead(id ? c.name + ' budget' : 'Monthly budget') + '<div class="sh-body"><p class="sh-lede">' +
    (id ? 'A monthly limit for ' + esc(c.name) + '.' : 'How much do you want to spend in a month, everything included?') +
    (usual > 0 ? ' You usually spend about <b>' + esc(money(niceRound(usual))) + '</b>.' : '') + '</p>' +
    '<label class="amt-field"><span class="cur" aria-hidden="true">' + esc(curSymbol()) + '</span><span class="sr">Budget amount</span><input id="bud-amt" inputmode="decimal" autocomplete="off" placeholder="0" value="' + (cur ? esc(String(cur)) : '') + '" autofocus></label></div>' +
    '<footer class="sh-foot">' + (cur ? '<button type="button" class="btn ghost danger" data-act="budget-remove" data-arg="' + esc(id || '') + '">Remove</button>' : '') +
    '<span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="button" class="btn primary" data-act="budget-save" data-arg="' + esc(id || '') + '">Save</button></footer>', {
    label: 'Budget',
    onMount: sh => $('#bud-amt', sh).addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); budgetSave(id || ''); } })
  });
}
async function budgetSave(id) {
  const v = evalAmount($('#bud-amt').value);
  if (!(v > 0)) { $('#bud-amt').focus(); return; }
  const b = budgets();
  const nb = { total: b.total, cats: Object.assign({}, b.cats), sample: false };
  if (id) nb.cats[id] = v; else nb.total = v;
  closeSheet();
  try { await saveBudgets(nb); toast((id ? catById(id).name + ' budget' : 'Monthly budget') + ' set to ' + money(v)); } catch (e) { toast(storeErrorText(e)); }
}
async function budgetRemove(id) {
  const b = budgets();
  const nb = { total: b.total, cats: Object.assign({}, b.cats), sample: false };
  if (id) delete nb.cats[id]; else nb.total = 0;
  closeSheet();
  try { await saveBudgets(nb); toast('Budget removed'); } catch (e) { toast(storeErrorText(e)); }
}
function openBudgetAdd() {
  const b = budgets();
  const cats = allCats().filter(c => c.type === 'expense' && !c.hidden && !b.cats[c.id] && (c.group === 'needs' || c.group === 'wants'));
  openSheet(sheetHead('Budget for which category?') + '<div class="sh-body"><div class="cat-grid" style="margin-top:4px">' + cats.map(c => '<button type="button" class="cat-opt" data-act="budget-edit" data-arg="' + esc(c.id) + '"><span class="em" aria-hidden="true">' + esc(c.emoji) + '</span>' + esc(c.name) + '</button>').join('') + '</div></div>', { label: 'Choose a category', wide: true });
}
let SUGG = [];
function openBudgetSuggest() {
  const A = analyze(UI.period);
  const scale = A.priorCount ? 1 : (A.isCurrent && A.dayIndex ? A.p.days / A.dayIndex : 1);
  const base = A.priorCount ? A.avgCat : new Map(Array.from(A.byCat.entries()).filter(([, v]) => v.kind === 'spend').map(([k, v]) => [k, v.total]));
  SUGG = Array.from(base.entries()).map(([id, v]) => ({ id, amount: niceRound(v * scale * 1.05) })).filter(s => s.amount > 0 && ['needs', 'wants'].indexOf(catById(s.id).group) >= 0).sort((a, b) => b.amount - a.amount).slice(0, 10);
  const total = niceRound((A.priorCount ? A.avgSpend : A.spend * scale) * 1.02);
  SUGG.unshift({ id: '', amount: total });
  openSheet(sheetHead('Suggested budgets') + '<div class="sh-body"><p class="sh-lede">Based on ' + (A.priorCount ? 'your average over the last ' + plural(A.priorCount, 'month') : 'your pace so far this month') + ', rounded a little up so they are realistic. Untick any you don’t want.</p>' +
    SUGG.map((s, i) => '<label class="list-row" style="cursor:pointer"><span><input type="checkbox" data-sugg="' + i + '" checked style="margin-right:10px;accent-color:var(--accent)">' + esc(s.id ? catById(s.id).emoji + '  ' + catById(s.id).name : 'Whole month') + '</span><b>' + esc(money(s.amount)) + '</b></label>').join('') +
    '</div><footer class="sh-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="button" class="btn primary" data-act="budget-apply">Use these budgets</button></footer>', { label: 'Suggested budgets' });
}
async function budgetApply() {
  const b = budgets();
  const nb = { total: b.total, cats: Object.assign({}, b.cats), sample: false };
  for (const el of $$('[data-sugg]')) { if (!el.checked) continue; const s = SUGG[+el.dataset.sugg]; if (s.id) nb.cats[s.id] = s.amount; else nb.total = s.amount; }
  closeSheet();
  try { await saveBudgets(nb); toast('Budgets saved'); } catch (e) { toast(storeErrorText(e)); }
}

/* ---------- settings ---------- */
function storageLine() {
  if (Store.mode === 'cloud') return ic('cloud') + '<span>' + (Store.isOwner ? 'Saved in your Claude account. People you invite with <b>Can edit</b> see and add to this same ledger, live, from their own phone.' : 'Saved in the shared household ledger in Claude. Everything you add shows up for everyone in the household.') + '</span>';
  if (Store.mode === 'device' && !IN_CLAUDE) return ic('device') + '<span>Saved privately in this browser, on this device. Nothing is sent anywhere. Download a backup to keep a copy or to move to another device.</span>';
  if (Store.mode === 'device') return ic('device') + '<span>Saved in this browser on this device only.' + (Store.reason === 'not-owner' ? ' The ledger behind this link belongs to its owner.' : ' Open the page in Claude while signed in to keep entries in your account.') + '</span>';
  return ic('alert') + '<span>Not saved: this browser blocks storage. Download a backup before closing the page.</span>';
}
function openSettings() {
  const s = settings();
  const curs = CURRENCIES.indexOf(s.currency) >= 0 ? CURRENCIES : [s.currency].concat(CURRENCIES);
  let dn = null;
  try { dn = new Intl.DisplayNames([LOCALE.lang], { type: 'currency' }); } catch (e) { dn = null; }
  const ord = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
  const rules = Object.keys(rulesMap()).length, recs = Object.values(recurringItems()).filter(r => r.active).length;
  const custom = allCats().filter(c => c.custom).length;
  openSheet(sheetHead('Settings') + '<div class="sh-body">' +
    '<section class="set-sec"><h3>You</h3>' +
    '<button type="button" class="set-link" data-act="household"><span class="lead">' + (household().setup ? '<span class="avatars">' + avatarHTML('p1', 'xs') + (household().solo ? '' : avatarHTML('p2', 'xs')) + '</span>' : ic('people')) + 'Household</span><span>' + esc(household().setup ? household().members.map(m => m.name).join(' & ') : 'set up') + '</span></button>' +
    '<button type="button" class="set-link" data-act="appearance"><span class="lead">' + ic('palette') + 'Background and look</span><span>' + esc((sceneById(Prefs.scene) || sceneById(defaultScene(meId()))).name) + '</span></button></section>' +
    '<section class="set-sec"><h3>Where your data lives</h3><p class="store-line">' + storageLine() + '</p></section>' +
    '<section class="set-sec"><h3>Money</h3>' +
    '<label class="field"><span>Currency</span><select id="set-cur">' + curs.map(c => '<option value="' + c + '"' + (c === s.currency ? ' selected' : '') + '>' + c + (dn ? ' · ' + esc(dn.of(c) || '') : '') + '</option>').join('') + '</select><small>Changing it relabels amounts. It doesn’t convert them.</small></label>' +
    '<label class="field"><span>Budget month starts on</span><select id="set-sd">' + Array.from({ length: 28 }, (x, i) => i + 1).map(n => '<option value="' + n + '"' + (n === s.startDay ? ' selected' : '') + '>' + (n === 1 ? 'the 1st (calendar month)' : 'the ' + ord(n)) + '</option>').join('') + '</select><small>Pick your payday if you budget from salary to salary.</small></label>' +
    '<label class="field"><span>A date like 05/10 means</span><select id="set-do"><option value="DMY"' + (s.dateOrder === 'DMY' ? ' selected' : '') + '>5 October (day first)</option><option value="MDY"' + (s.dateOrder === 'MDY' ? ' selected' : '') + '>May 10 (month first)</option></select></label></section>' +
    '<section class="set-sec"><h3>Smart entry</h3>' +
    '<label class="switch"><input type="checkbox" id="set-ai"' + (s.ai !== 'off' ? ' checked' : '') + '><span>Let Claude read tricky entries, receipts and your questions<br><small class="muted">Uses your own Claude plan. Simple entries like “coffee 120” are understood right here without it.' + (AI.ok ? '' : ' Claude isn’t available in this view.') + '</small></span></label>' +
    '<label class="switch"><input type="checkbox" id="set-voice"' + (s.voiceAuto ? ' checked' : '') + '><span>Save spoken entries as soon as you stop talking<br><small class="muted">You can undo each one from the message that appears.</small></span></label></section>' +
    '<section class="set-sec"><h3>Organize</h3>' +
    '<button type="button" class="set-link" data-act="open-cats">Categories<span>' + (custom ? custom + ' of your own' : 'rename, add, hide') + '</span></button>' +
    '<button type="button" class="set-link" data-act="open-recurring">Repeating entries<span>' + (recs ? recs + ' active' : 'none yet') + '</span></button>' +
    '<button type="button" class="set-link" data-act="open-rules">Learned shortcuts<span>' + (rules ? rules + ' remembered' : 'none yet') + '</span></button></section>' +
    '<section class="set-sec"><h3>Your data</h3>' +
    '<button type="button" class="set-link" data-act="export-csv">Export a spreadsheet<span>CSV</span></button>' +
    '<button type="button" class="set-link" data-act="export-json">Download a full backup<span>JSON</span></button>' +
    '<button type="button" class="set-link" data-act="open-import">Import<span>bank messages, statements, backups</span></button>' +
    (hasSamples() ? '<button type="button" class="set-link" data-act="clear-examples">Clear example data</button>' : '<button type="button" class="set-link" data-act="examples">Add example data<span>marked, removable</span></button>') +
    '<button type="button" class="set-link danger" data-act="wipe">Delete everything</button></section>' +
    deviceSectionHTML() +
    '<section class="set-sec"><h3>Help</h3><button type="button" class="set-link" data-act="help">What you can type or say</button></section>' +
    '</div>', { label: 'Settings', onMount: bindSettings });
}
function bindSettings(sh) {
  const save = async patch => { try { await saveSettings(patch); toast('Saved'); } catch (e) { toast(storeErrorText(e)); } };
  $('#set-cur', sh).addEventListener('change', ev => { setCurrency(ev.target.value); save({ currency: ev.target.value }); });
  $('#set-sd', sh).addEventListener('change', ev => { UI.periodTouched = false; UI.period = ''; save({ startDay: +ev.target.value }); });
  $('#set-do', sh).addEventListener('change', ev => save({ dateOrder: ev.target.value }));
  $('#set-ai', sh).addEventListener('change', ev => { if (ev.target.checked) AI.blocked = AI.blocked === 'not_granted' ? AI.blocked : ''; save({ ai: ev.target.checked ? 'auto' : 'off' }); });
  $('#set-voice', sh).addEventListener('change', ev => save({ voiceAuto: ev.target.checked }));
}
/* installing the website version as an app */
let INSTALL_EVT = null;
function isInstalled() { try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; } catch (e) { return false; } }
function deviceSectionHTML() {
  if (IN_CLAUDE) return '';
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent || '') || (/Mac/.test(navigator.platform || '') && navigator.maxTouchPoints > 1);
  let body;
  if (isInstalled()) body = '<p class="store-line">' + ic('check') + '<span>Installed on this device. It opens like an app and works offline.</span></p>';
  else if (INSTALL_EVT) body = '<button type="button" class="set-link" data-act="install-app">Install Pocket Ledger<span>opens like an app, works offline</span></button>';
  else if (ios) body = '<p class="store-line">' + ic('device') + '<span>To install: tap the Share button in Safari, then <b>Add to Home Screen</b>. Installed, it works offline and Safari keeps your entries safe.</span></p>';
  else body = '<p class="store-line">' + ic('device') + '<span>Use your browser’s <b>Install app</b> or <b>Add to Home screen</b> option to keep Pocket Ledger one tap away. It works offline.</span></p>';
  return '<section class="set-sec"><h3>This device</h3>' + body + '</section>';
}
function openCategories() {
  openSheet(sheetHead('Categories') + '<div class="sh-body" id="cat-body"></div><footer class="sh-foot"><button type="button" class="btn" data-act="settings">Back</button><span class="spacer"></span><button type="button" class="btn primary" data-act="cat-new">' + ic('plus') + 'New category</button></footer>', { label: 'Categories', wide: true, onMount: renderCatManager });
}
function renderCatManager() {
  const body = $('#cat-body');
  if (!body) return;
  const cats = allCats(), counts = {};
  for (const e of Store.entries.values()) counts[e.cat] = (counts[e.cat] || 0) + 1;
  const sec = (t, title) => '<p class="lbl-s" style="margin-top:14px">' + title + '</p>' + cats.filter(c => c.type === t).map(c => '<div class="list-row"><div><div class="t">' + esc(c.emoji + '  ' + c.name) + (c.hidden ? ' <span class="chip">Hidden</span>' : '') + '</div><div class="m">' + esc((t === 'expense' ? GROUP_LABEL[c.group] + ' · ' : '') + plural(counts[c.id] || 0, 'entry', 'entries')) + '</div></div><div class="acts"><button type="button" class="btn mini" data-act="cat-edit" data-arg="' + esc(c.id) + '">Edit</button></div></div>').join('');
  body.innerHTML = '<p class="sh-lede">Rename a category, change its emoji, decide whether it is a need or a want, or hide ones you never use.</p>' + sec('expense', 'Money out') + sec('income', 'Money in');
}
let CE = { id: '', type: 'expense' };
function openCatEdit(id) {
  const isNew = !id;
  const c = id ? catById(id) : { id: '', name: '', emoji: '🏷️', type: 'expense', group: 'wants', custom: true };
  CE = { id: id || '', type: c.type };
  openSheet(sheetHead(isNew ? 'New category' : 'Edit category') + '<div class="sh-body">' +
    (isNew ? '<div class="seg" role="radiogroup" aria-label="Type" style="margin-top:4px"><button type="button" role="radio" data-act="ce-type" data-arg="expense" aria-checked="true">Money out</button><button type="button" role="radio" data-act="ce-type" data-arg="income" aria-checked="false">Money in</button></div>' : '') +
    '<div class="row2" style="grid-template-columns:90px minmax(0,1fr)"><label class="field"><span>Emoji</span><input id="ce-emoji" maxlength="8" value="' + esc(c.emoji) + '"></label><label class="field"><span>Name</span><input id="ce-name" maxlength="40" value="' + esc(c.name) + '"' + (isNew ? ' autofocus' : '') + '></label></div>' +
    '<label class="field" id="ce-group-wrap"' + (c.type === 'income' ? ' hidden' : '') + '><span>Counts as</span><select id="ce-group">' + ['needs', 'wants', 'savings', 'transfer'].map(g => '<option value="' + g + '"' + (c.group === g ? ' selected' : '') + '>' + GROUP_LABEL[g] + '</option>').join('') + '</select><small>Saving and transfers are left out of your spending totals.</small></label>' +
    (!isNew ? '<label class="switch"><input type="checkbox" id="ce-hidden"' + (c.hidden ? ' checked' : '') + '><span>Hide from pickers. Entries already in it stay.</span></label>' : '') +
    '</div><footer class="sh-foot">' + (!isNew && c.custom ? '<button type="button" class="btn ghost danger" data-act="cat-delete" data-arg="' + esc(c.id) + '">Delete</button>' : '') +
    '<span class="spacer"></span><button type="button" class="btn" data-act="open-cats">Cancel</button><button type="button" class="btn primary" data-act="cat-save">Save</button></footer>', { label: isNew ? 'New category' : 'Edit category' });
}
async function saveCatEdit() {
  const name = $('#ce-name').value.trim();
  if (!name) { $('#ce-name').focus(); return; }
  const emoji = Array.from($('#ce-emoji').value.trim() || '🏷️').slice(0, 4).join('');
  const items = Object.assign({}, (Store.meta.categories && Store.meta.categories.items) || {});
  const grp = $('#ce-group') ? $('#ce-group').value : 'wants';
  if (!CE.id) items['c' + Date.now().toString(36)] = { name, emoji, type: CE.type, group: CE.type === 'income' ? 'income' : grp };
  else {
    const def = DEFAULT_CATS.find(c => c.id === CE.id);
    const prev = items[CE.id] || {};
    const next = Object.assign({}, prev, { name, emoji, hidden: !!($('#ce-hidden') && $('#ce-hidden').checked) });
    if (CE.type === 'expense') next.group = grp;
    if (!def) next.type = prev.type || CE.type;
    items[CE.id] = next;
  }
  try { await putMeta('categories', { items }); } catch (e) { toast(storeErrorText(e)); return; }
  openCategories();
  toast('Category saved');
}
async function deleteCat(id) {
  const c = catById(id);
  const fallback = c.type === 'income' ? 'other_in' : 'other';
  const moved = Array.from(Store.entries.values()).filter(e => e.cat === id).map(e => normEntry(e.id, Object.assign({}, e, { cat: fallback, updated: Date.now() })));
  const items = Object.assign({}, (Store.meta.categories && Store.meta.categories.items) || {});
  delete items[id];
  const map = Object.assign({}, rulesMap());
  let rulesChanged = false;
  for (const k in map) if (map[k] === id) { delete map[k]; rulesChanged = true; }
  const b = budgets();
  try {
    if (moved.length) await putEntries(moved);
    await putMeta('categories', { items });
    if (rulesChanged) await putMeta('rules', { map });
    if (b.cats[id]) { delete b.cats[id]; await saveBudgets(b); }
  } catch (e) { toast(storeErrorText(e)); return; }
  openCategories();
  toast('Deleted “' + c.name + '”' + (moved.length ? '. ' + plural(moved.length, 'entry', 'entries') + ' moved to ' + catById(fallback).name : ''));
}
function openRecurringManager() {
  const list = Object.values(recurringItems()).sort((a, b) => (a.active === b.active ? (a.next < b.next ? -1 : 1) : a.active ? -1 : 1));
  const every = { weekly: 'week', monthly: 'month', yearly: 'year' };
  openSheet(sheetHead('Repeating entries') + '<div class="sh-body">' +
    (list.length ? list.map(r => '<div class="list-row"><div><div class="t">' + esc(catById(r.tpl.cat, r.tpl.type).emoji + '  ' + r.tpl.note) + ' · ' + esc((r.tpl.type === 'income' ? '+' : '') + money(+r.tpl.amount || 0)) + '</div><div class="m">' + esc(r.active ? 'Every ' + every[r.every] + ' · next ' + dayLabel(r.next) : 'Paused') + '</div></div>' +
      '<div class="acts"><button type="button" class="btn mini" data-act="rec-toggle" data-arg="' + esc(r.id) + '">' + (r.active ? 'Pause' : 'Resume') + '</button><button type="button" class="btn mini ghost danger" data-act="rec-delete" data-arg="' + esc(r.id) + '">Stop</button></div></div>').join('')
      : '<p class="sh-lede">Nothing repeats yet. Type something like <b>rent ' + esc(String(exAmount(22000, 1650))) + ' monthly</b> or <b>gym ' + esc(String(exAmount(1500, 45))) + ' every month</b>, or choose Repeats when you add an entry.</p>') +
    '<p class="cc-sub" style="margin-top:14px">Due entries are added automatically when you open the page. Stopping one keeps everything already logged.</p></div>' +
    '<footer class="sh-foot"><button type="button" class="btn" data-act="settings">Back</button><span class="spacer"></span><button type="button" class="btn primary" data-act="new-repeat">' + ic('plus') + 'Add one</button></footer>', { label: 'Repeating entries' });
}
async function recToggle(id) {
  const r = recurringItems()[id];
  if (!r) return;
  const next = Object.assign({}, r, { active: !r.active });
  if (next.active) { const t = todayStr(); let n = next.next, g = 0; while (n < t && g < 400) { n = nextOccurrence(n, next.every, next.day); g++; } next.next = n; }
  try { await saveRecurring([next]); } catch (e) { toast(storeErrorText(e)); return; }
  openRecurringManager();
  if (next.active) materializeRecurring();
}
async function recDelete(id) {
  try { await removeRecurring([id]); } catch (e) { toast(storeErrorText(e)); return; }
  openRecurringManager();
  toast('Stopped. Past entries are kept.');
}
function openRulesManager() {
  const map = rulesMap();
  const keys = Object.keys(map).sort();
  openSheet(sheetHead('Learned shortcuts') + '<div class="sh-body"><p class="sh-lede">When you change a category, I remember the word for next time. Forget any that are wrong.</p>' +
    (keys.length ? keys.map(k => '<div class="list-row"><div><div class="t">“' + esc(k) + '”</div><div class="m">goes to ' + esc(catById(map[k]).emoji + ' ' + catById(map[k]).name) + '</div></div><div class="acts"><button type="button" class="btn mini" data-act="rule-forget" data-arg="' + esc(k) + '">Forget</button></div></div>').join('') : '<p class="muted" style="margin-top:12px">Nothing learned yet.</p>') +
    '</div><footer class="sh-foot"><button type="button" class="btn" data-act="settings">Back</button></footer>', { label: 'Learned shortcuts' });
}
async function ruleForget(k) {
  const map = Object.assign({}, rulesMap());
  delete map[k];
  try { await putMeta('rules', { map }); } catch (e) { toast(storeErrorText(e)); return; }
  openRulesManager();
}
function openCopySheet(name, data) {
  openSheet(sheetHead('Copy your file') + '<div class="sh-body"><p class="sh-lede">Saving files isn’t available here. Copy the text below into a file named <b>' + esc(name) + '</b>.</p>' +
    '<label class="field"><span>' + esc(name) + '</span><textarea id="copy-text" readonly style="min-height:240px;font-family:var(--font-mono);font-size:12px">' + esc(String(data).slice(0, 3e6)) + '</textarea></label></div>' +
    '<footer class="sh-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="copy-text">' + ic('copy') + 'Copy</button></footer>', { label: 'Copy file', wide: true });
}
function openWipe() {
  const both = Store.mode === 'cloud' && !household().solo;
  openSheet(sheetHead('Delete everything?') + '<div class="sh-body"><p class="sh-lede">This removes all ' + plural(Store.entries.size, 'entry', 'entries') + ', the plan, budgets, categories, repeating entries and learned shortcuts ' + (Store.mode === 'cloud' ? (both ? 'for everyone in the household' : 'from your account') : 'from this device') + '. It can’t be undone, so download a backup first if you might want them later.</p>' +
    '<label class="field"><span>Type DELETE to confirm</span><input id="wipe-confirm" autocomplete="off" autocapitalize="characters" spellcheck="false"></label></div>' +
    '<footer class="sh-foot"><button type="button" class="btn" data-act="export-json">Download backup</button><span class="spacer"></span><button type="button" class="btn danger solid" id="wipe-go" data-act="wipe-go" disabled>Delete everything</button></footer>', {
    label: 'Delete everything',
    onMount: sh => { const i = $('#wipe-confirm', sh); i.addEventListener('input', () => { $('#wipe-go', sh).disabled = i.value.trim().toUpperCase() !== 'DELETE'; }); }
  });
}
function openHelp() {
  const a = (inr, usd) => String(exAmount(inr, usd));
  const ex = [
    'Coffee ' + a(120, 4.5), 'Uber ' + a(230, 18) + ' yesterday on card', 'Salary ' + (southAsian() ? '85k' : a(85000, 5200)) + ' credited', 'Netflix ' + a(649, 15.49) + ' monthly',
    'Lunch ' + a(350, 14) + ' and movie ' + a(500, 16), 'Groceries ' + a(1240, 86) + ' at ' + exName('DMart') + ' on 5 Oct #home', 'Paid credit card bill ' + a(15000, 900), 'budget food ' + a(8000, 500)
  ];
  const list = items => '<ul class="plain">' + items.map(x => '<li><span>' + x + '</span></li>').join('') + '</ul>';
  openSheet(sheetHead('What you can type or say') + '<div class="sh-body">' +
    '<p class="sh-lede">Write it the way you’d text it. One line can hold several entries.</p>' +
    '<div class="try-row" style="margin-top:12px">' + ex.map(t => '<button type="button" class="try-chip" data-act="try" data-arg="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
    '<section class="set-sec"><h3>What it understands</h3>' + list([
      '<b>Amounts:</b> 120, 1,250.50, 25k, 1.5 lakh, ₹ $ € £, and spoken numbers like “two hundred fifty”.',
      '<b>Dates:</b> today, yesterday, last Friday, 3 days ago, 5 Oct, 12/10, on the 25th.',
      '<b>How you paid:</b> cash, UPI, GPay, card, credit card, net banking, wallet.',
      '<b>Money in:</b> salary, received, refund, cashback, credited, or start with a plus sign.',
      '<b>Repeats:</b> weekly, monthly, every month, yearly. Due entries add themselves.',
      '<b>Tags:</b> add #trip or #work and search for them later.',
      '<b>Budgets:</b> “budget food 8000” or “monthly budget 45000”.'
    ].concat(household().solo ? [] : [
      '<b>Whose it was:</b> say a name, like “' + esc(household().members[1].name) + ' paid ' + a(450, 18) + ' for dinner” or “' + esc(household().members[0].name) + '’s cab ' + a(230, 18) + '”.',
      '<b>Shared money:</b> “shared groceries ' + a(1240, 86) + '”, “our rent”, “for both of us”. Rent, groceries and bills count as shared unless you say otherwise.'
    ])) + '</section>' +
    '<section class="set-sec"><h3>Other ways in</h3>' + list([
      AI.ok ? '<b>Receipts and screenshots:</b> the + button, or paste or drop an image. Claude reads the total.' : '<b>Receipts:</b> reading photos needs the Claude version of Pocket Ledger.',
      '<b>Bank messages:</b> paste many SMS or e-mail alerts at once. Balances and OTPs are ignored.',
      '<b>Statements:</b> import a CSV from your bank or card.'
    ]) + '</section>' +
    '<section class="set-sec"><h3>What counts as spending</h3><p class="sh-lede">Savings and investments, credit card bill payments, ATM withdrawals and transfers between your own accounts are kept but left out of spending, so nothing is counted twice.</p></section>' +
    '</div>', { label: 'Help', wide: true });
}
async function openPermissions() {
  if (UI.permissions && typeof UI.permissions.manage === 'function') {
    try { await UI.permissions.manage(); AI.blocked = ''; UI.mounted = ''; render(); return; } catch (e) { /* fall through */ }
  }
  toast('Open this page’s menu and choose Permissions to turn on Claude access.');
}

/* ---------- people: whose money, who added it ---------- */
function whoPickHTML(act, sel) {
  return ['p1', 'p2', 'joint'].map(w => '<button type="button" class="who-opt" role="radio" data-act="' + act + '" data-arg="' + w + '" aria-checked="' + (w === sel) + '">' + avatarHTML(w) + '<span>' + esc(memberName(w)) + '</span></button>').join('');
}
function setPicked(sel, arg, attr) { for (const b of $$(sel)) b.setAttribute(attr || 'aria-checked', String(b.dataset.arg === arg)); }
const SOURCE_WORD = { text: 'typed', voice: 'spoken', receipt: 'read from a receipt', sms: 'from a bank message', csv: 'from a statement', recurring: 'added automatically', plan: 'from the plan', manual: 'filled in by hand', import: 'imported' };
function byLineHTML(e) {
  const two = !household().solo && (e.by === 'p1' || e.by === 'p2');
  const bits = [two ? 'Added by ' + memberName(e.by) : 'Added'];
  if (SOURCE_WORD[e.source]) bits.push(SOURCE_WORD[e.source]);
  if (e.created > 0) bits.push(fmtDate(ymd(new Date(e.created)), { day: 'numeric', month: 'short', year: 'numeric' }));
  return '<p class="by-line">' + (two ? avatarHTML(e.by, 'xs') : '') + '<span>' + esc(bits.join(' · ')) + '</span></p>';
}

/* ---------- the household ---------- */
let HH = null;
function openHousehold() {
  const h = household();
  HH = { two: h.setup ? !h.solo : true, n1: h.members[0] ? h.members[0].name : '', n2: h.members[1] ? h.members[1].name : '', me: meId(), shared: h.sharedDefault };
  if (Store.meta.household && Store.meta.household.sample) { HH.n1 = ''; HH.n2 = ''; }
  openSheet(sheetHead('Your household') + '<div class="sh-body" id="hh-body"></div><footer class="sh-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="button" class="btn primary" data-act="hh-save">Save</button></footer>', { label: 'Household', onMount: renderHousehold });
}
function hhName(id) { return (id === 'p1' ? HH.n1 : HH.n2).trim() || (id === 'p1' ? 'First person' : 'Second person'); }
function renderHousehold() {
  const body = $('#hh-body');
  if (!body) return;
  let h = '<p class="sh-lede">Track money together. Every entry knows whose it is and who added it, and you can look at one person or everyone at once.</p>' +
    '<div class="seg full" role="radiogroup" aria-label="How many people" style="margin-top:16px"><button type="button" role="radio" data-act="hh-two" data-arg="0" aria-checked="' + !HH.two + '">Just me</button><button type="button" role="radio" data-act="hh-two" data-arg="1" aria-checked="' + HH.two + '">Two of us</button></div>' +
    '<div class="row2"><label class="field"><span>' + (HH.two ? 'First person' : 'Your name') + '</span><input id="hh-n1" maxlength="24" autocomplete="off" value="' + esc(HH.n1) + '" placeholder="Name"' + (HH.n1 ? '' : ' autofocus') + '></label>' +
    (HH.two ? '<label class="field"><span>Second person</span><input id="hh-n2" maxlength="24" autocomplete="off" value="' + esc(HH.n2) + '" placeholder="Name"></label>' : '') + '</div>';
  if (HH.two) {
    h += '<div class="field"><span>Who is using ' + (IN_CLAUDE ? 'this account' : 'this device') + '?</span><div class="who-pick" role="radiogroup" aria-label="Who is using this">' +
      ['p1', 'p2'].map(id => '<button type="button" class="who-opt" role="radio" data-act="hh-me" data-arg="' + id + '" aria-checked="' + (HH.me === id) + '"><span class="av ' + id + '">' + esc(initials(hhName(id))) + '</span><span>' + esc(hhName(id)) + '</span></button>').join('') +
      '</div><small>Your new entries count as yours unless you say otherwise. Your background is yours too.</small></div>' +
      '<label class="switch"><input type="checkbox" id="hh-shared"' + (HH.shared ? ' checked' : '') + '><span>Count rent, groceries and bills as shared<br><small class="muted">Everything else counts as the person’s own. You can change any entry.</small></span></label>' + inviteHTML();
  }
  body.innerHTML = h;
  const sync = () => { for (const b of $$('[data-act="hh-me"]', body)) { const n = hhName(b.dataset.arg); b.firstChild.textContent = initials(n); b.lastChild.textContent = n; } };
  const i1 = $('#hh-n1', body), i2 = $('#hh-n2', body), sw = $('#hh-shared', body);
  i1.addEventListener('input', () => { HH.n1 = i1.value; sync(); });
  if (i2) i2.addEventListener('input', () => { HH.n2 = i2.value; sync(); });
  if (sw) sw.addEventListener('change', () => { HH.shared = sw.checked; });
  for (const i of [i1, i2]) if (i) i.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); householdSave(); } });
}
function inviteHTML() {
  const other = HH.n2.trim() || 'them';
  if (IN_CLAUDE && Store.mode === 'cloud' && Store.isOwner) {
    return '<section class="set-sec"><h3>Invite ' + esc(HH.n2.trim() || 'your partner') + '</h3><ol class="steps-box">' +
      '<li>Open <b>Share</b> at the top of this page.</li><li>Invite ' + esc(other) + '’s e-mail and choose <b>Can edit</b>.</li>' +
      '<li>' + esc(other) + ' opens the link signed in to Claude. Everything either of you adds shows up for both, live.</li></ol>' +
      '<p class="cc-sub" style="margin-top:10px">Share with invited people only, not “anyone with the link”. Reading receipts and answering questions use Claude, which may not work for people outside your Claude organization. Everything else works for both of you.</p></section>';
  }
  if (!IN_CLAUDE) return '<section class="set-sec"><h3>Two phones?</h3><p class="sh-lede">This website keeps entries on the device you use. To share one live ledger across two phones, use the Claude version of Pocket Ledger and invite each other there.</p></section>';
  return '';
}
async function householdSave() {
  if (!HH) return;
  const n1 = HH.n1.trim().slice(0, 24), n2 = HH.n2.trim().slice(0, 24);
  if (!n1) { const i = $('#hh-n1'); if (i) i.focus(); toast('Add a name first'); return; }
  if (HH.two && !n2) { const i = $('#hh-n2'); if (i) i.focus(); toast('Add the second person’s name'); return; }
  const members = HH.two ? [{ id: 'p1', name: n1 }, { id: 'p2', name: n2 }] : [{ id: 'p1', name: n1 }];
  const before = meId(), me = HH.two ? HH.me : 'p1';
  closeSheet();
  try { await putMeta('household', { members, sharedDefault: !!HH.shared, sample: false }); } catch (e) { toast(storeErrorText(e)); return; }
  await savePrefs({ me });
  if (!Prefs.scene && before !== meId()) applyLook();
  toast(HH.two ? 'Saved. Hello ' + n1 + ' & ' + n2 + '!' : 'Saved. Hello ' + n1 + '!');
}

/* ---------- background and look ---------- */
function openAppearance() {
  openSheet(sheetHead('Background and look') + '<div class="sh-body" id="look-body"></div>', { label: 'Background and look', wide: true, onMount: renderAppearance });
}
function currentSceneId() { return (sceneById(Prefs.scene) || sceneById(defaultScene(meId()))).id; }
function renderAppearance() {
  const body = $('#look-body');
  if (!body) return;
  const cur = currentSceneId(), h = household();
  const other = h.solo ? '' : memberName(meId() === 'p1' ? 'p2' : 'p1');
  body.innerHTML = '<p class="sh-lede">Pick the scene that lives behind your glass. ' + (other ? 'It’s yours alone: ' + esc(other) + ' picks their own.' : 'It drifts slowly and rests when the page is hidden.') + '</p>' +
    '<div class="scene-grid">' + SCENES.map(sc => '<button type="button" class="scene-tile' + (sc.tone === 'light' ? ' lt' : '') + '" data-act="scene" data-arg="' + sc.id + '" aria-pressed="' + (sc.id === cur) + '"><span class="sw" style="background:' + esc(sceneCSS(sc)) + '"></span><b>' + esc(sc.name) + '</b><span class="tick" aria-hidden="true">' + ICON.check + '</span></button>').join('') + '</div>' +
    '<label class="switch"><input type="checkbox" id="look-motion"' + (Prefs.motion ? ' checked' : '') + '><span>Moving background<br><small class="muted">' + (reducedMotion() ? 'Your device asks for less motion, so it stays still.' : 'Slow and gentle. Turn it off to save battery.') + '</small></span></label>' +
    '<div class="field"><span>Glass</span><div class="seg full" role="radiogroup" aria-label="Glass effect">' + [['full', 'Liquid'], ['frosted', 'Frosted'], ['saver', 'Battery saver']].map(o => '<button type="button" role="radio" data-act="fx" data-arg="' + o[0] + '" aria-checked="' + (Prefs.fx === o[0]) + '">' + o[1] + '</button>').join('') + '</div>' +
    '<small>' + (refractSupported() ? 'Liquid bends light at the edge of every panel.' : 'Liquid refraction needs Chrome or Edge. Here it looks frosted.') + ' Battery saver uses solid panels and a still background.</small></div>';
  $('#look-motion', body).addEventListener('change', ev => { savePrefs({ motion: ev.target.checked }); applyLook(); });
}

/* ---------- the plan: income and fixed costs ---------- */
let PE = null;
function openPlanEditor(kind, id, preset) {
  const plan = getPlan(), solo = household().solo;
  const it = id ? plan.incomes.concat(plan.fixed).find(x => x.id === id) : null;
  if (id && !it) return;
  kind = it ? it.kind : (kind === 'income' ? 'income' : 'fixed');
  const d = it ? Object.assign({}, it) : Object.assign({ id: '', kind, name: '', who: '', cat: kind === 'income' ? 'salary' : 'home', amount: 0, day: 1, auto: false }, preset || {});
  if (!d.who) d.who = solo ? 'p1' : kind === 'income' ? meId() : (SHARED_CATS.has(d.cat) ? 'joint' : meId());
  PE = { isNew: !it, d, whoTouched: !!it };
  const type = kind === 'income' ? 'income' : 'expense';
  const title = it ? (kind === 'income' ? 'Edit income' : 'Edit fixed cost') : (kind === 'income' ? 'Money coming in' : 'A fixed cost');
  openSheet(sheetHead(title) + '<div class="sh-body">' +
    '<p class="sh-lede">' + (kind === 'income' ? 'Salary, freelance work, rent you receive, interest: anything that arrives most months.' : 'Rent, EMIs, sending money home, insurance, SIPs: money that is spoken for before the month starts.') + '</p>' +
    '<label class="amt-field"><span class="cur" aria-hidden="true">' + esc(curSymbol()) + '</span><span class="sr">Amount each month</span><input id="pe-amount" inputmode="decimal" autocomplete="off" placeholder="0" value="' + (d.amount ? esc(String(d.amount)) : '') + '"' + (d.amount ? '' : ' autofocus') + '></label>' +
    '<p class="calc" id="pe-calc">Each month</p>' +
    '<label class="field"><span>Name</span><input id="pe-name" maxlength="60" autocomplete="off" value="' + esc(d.name) + '" placeholder="' + (kind === 'income' ? 'Salary' : 'Rent') + '"></label>' +
    '<div class="field"><span>Category</span><div class="cat-grid" id="pe-cats">' + allCats().filter(c => c.type === type && (!c.hidden || c.id === d.cat)).map(c => '<button type="button" class="cat-opt" data-act="pe-cat" data-arg="' + esc(c.id) + '" aria-pressed="' + (c.id === d.cat) + '"><span class="em" aria-hidden="true">' + esc(c.emoji) + '</span>' + esc(c.name) + '</button>').join('') + '</div></div>' +
    (solo ? '' : '<div class="field"><span>' + (kind === 'income' ? 'Whose income' : 'Whose cost') + '</span><div class="who-pick" role="radiogroup" aria-label="Whose">' + whoPickHTML('pe-who', d.who) + '</div></div>') +
    '<label class="field"><span>' + (kind === 'income' ? 'Usually arrives on' : 'Due on') + '</span><select id="pe-day">' + Array.from({ length: 31 }, (x, i) => i + 1).map(n => '<option value="' + n + '"' + (n === d.day ? ' selected' : '') + '>the ' + ordinal(n) + (n >= 29 ? ' (or the last day)' : '') + '</option>').join('') + '</select></label>' +
    '<label class="switch"><input type="checkbox" id="pe-auto"' + (d.auto ? ' checked' : '') + '><span>Log it by itself on that day<br><small class="muted">Good for fixed amounts like rent or a salary. Otherwise tap ' + (kind === 'income' ? 'Received' : 'Paid') + ' when it happens.</small></span></label>' +
    '</div><footer class="sh-foot">' + (it ? '<button type="button" class="btn ghost danger" data-act="pe-delete">Remove</button>' : '') + '<span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="button" class="btn primary" data-act="pe-save">' + (it ? 'Save' : 'Add to plan') + '</button></footer>', {
    label: title,
    onMount: sh => {
      const amt = $('#pe-amount', sh), calc = $('#pe-calc', sh);
      amt.addEventListener('input', () => { calc.classList.remove('err'); const v = evalAmount(amt.value); calc.textContent = /[+*/x×()]|\d-\d/.test(amt.value) && v ? '= ' + money(v) + ' each month' : 'Each month'; });
      for (const s of ['#pe-amount', '#pe-name']) $(s, sh).addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); planEditorSave(); } });
    }
  });
}
async function planEditorSave() {
  if (!PE) return;
  const d = PE.d;
  d.amount = evalAmount($('#pe-amount').value);
  if (!(d.amount > 0)) { const c = $('#pe-calc'); c.textContent = 'Enter an amount above zero.'; c.classList.add('err'); $('#pe-amount').focus(); return; }
  d.name = $('#pe-name').value.trim() || catById(d.cat, d.kind === 'income' ? 'income' : 'expense').name;
  d.day = clamp(parseInt($('#pe-day').value, 10) || 1, 1, 31);
  d.auto = $('#pe-auto').checked;
  if (!d.id) d.id = uid(d.kind === 'income' ? 'i' : 'f');
  const isNew = PE.isNew;
  closeSheet();
  try { await upsertPlanItem(d); } catch (e) { toast(storeErrorText(e)); return; }
  toast((isNew ? 'Added ' : 'Saved ') + d.name + ' · ' + money(d.amount) + ' a month');
  materializePlan();
}
function openGoalEditor() {
  const plan = getPlan(), A = analyze(UI.period, 'all');
  const inc = A.plan ? A.plan.baseIncome : A.income;
  const sug = inc > 0 ? niceRound(inc * 0.2) : 0;
  openSheet(sheetHead('Saving goal') + '<div class="sh-body"><p class="sh-lede">How much do you want to keep each month? It’s set aside before your everyday money is worked out.' + (sug ? ' A common target is a fifth of income, about <b>' + esc(money(sug)) + '</b>.' : '') + '</p>' +
    '<label class="amt-field"><span class="cur" aria-hidden="true">' + esc(curSymbol()) + '</span><span class="sr">Saving goal each month</span><input id="goal-amt" inputmode="decimal" autocomplete="off" placeholder="' + (sug || 0) + '" value="' + (plan.save ? esc(String(plan.save)) : '') + '" autofocus></label>' +
    (sug ? '<div class="chips" style="margin-top:14px">' + [0.1, 0.2, 0.3].map(f => '<button type="button" class="chip-btn" data-act="goal-pick" data-arg="' + niceRound(inc * f) + '">' + pct(f) + ' · ' + esc(compact(niceRound(inc * f))) + '</button>').join('') + '</div>' : '') +
    '</div><footer class="sh-foot">' + (plan.save ? '<button type="button" class="btn ghost danger" data-act="goal-remove">Remove</button>' : '') + '<span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">Cancel</button><button type="button" class="btn primary" data-act="goal-save">Save</button></footer>', {
    label: 'Saving goal', onMount: sh => $('#goal-amt', sh).addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); goalSave(); } })
  });
}
async function goalSave() {
  const v = evalAmount($('#goal-amt').value);
  if (!(v > 0)) { $('#goal-amt').focus(); return; }
  closeSheet();
  try { await setPlanSave(v); toast('Saving goal set to ' + money(v) + ' a month'); } catch (e) { toast(storeErrorText(e)); }
}
function openPlanItem(id) {
  const A = analyze(UI.period, 'all'), P = A.plan;
  const r = P && P.rows.find(x => x.id === id);
  if (!r) return;
  const income = r.kind === 'income', doneWord = income ? 'Received' : 'Paid';
  const st = { done: doneWord, partial: moneyR(r.paid) + ' of ' + moneyR(r.amount) + ' so far', late: (income ? 'Expected since ' : 'Late · was due ') + dayLabel(r.due), soon: 'Due ' + dayLabel(r.due), upcoming: 'Due ' + dayLabel(r.due) }[r.state];
  const tone = r.state === 'done' ? 'good' : r.state === 'late' ? 'bad' : r.state === 'upcoming' ? '' : 'warn';
  openSheet(sheetHead(r.name) + '<div class="sh-body"><div class="pi-head">' + avatarHTML(r.who, 'lg') + '<div><div class="pi-amt">' + esc(money(r.amount)) + '</div><span class="chip' + (tone ? ' tone-' + tone : '') + '">' + ic(STATE_LABEL[r.state][0]) + esc(st) + '</span></div></div>' +
    '<p class="sh-lede" style="margin-top:14px">' + esc(catById(r.cat, income ? 'income' : 'expense').name + (household().solo ? '' : ' · ' + memberName(r.who)) + ' · the ' + ordinal(r.day) + ' of every month' + (r.auto ? ' · logs itself' : '')) + '</p>' +
    (r.entries.length ? '<p class="lbl-s" style="margin-top:16px">Logged in ' + esc(periodLabel(A.p)) + '</p><div class="pi-entries list" style="border-radius:18px;background:var(--fill);margin-top:6px">' + r.entries.map(rowHTML).join('') + '</div>' : '<p class="cc-sub" style="margin-top:12px">Nothing logged for it in ' + esc(periodLabel(A.p)) + ' yet.</p>') +
    '</div><footer class="sh-foot"><button type="button" class="btn" data-act="plan-edit" data-arg="' + esc(r.id) + '">Edit</button><span class="spacer"></span>' +
    (r.state === 'done' ? '<button type="button" class="btn" data-act="close-sheet">Close</button>' : '<button type="button" class="btn primary" data-act="plan-pay" data-arg="' + esc(r.id) + '">' + (r.state === 'partial' ? 'Log the rest' : 'Mark ' + doneWord.toLowerCase()) + '</button>') + '</footer>', { label: r.name });
}

/* fill the plan in from what already repeats in the ledger */
let PS = { items: [], save: 0 };
function planSuggestions() {
  const plan = getPlan(), today = todayStr(), since = addDays(today, -95);
  const have = plan.incomes.concat(plan.fixed);
  const groups = new Map(), months = new Set();
  for (const e of sortedEntries()) {
    if (e.date > today) continue;
    if (e.date < since) break;
    months.add(e.date.slice(0, 7));
    const income = e.type === 'income';
    const fixed = !income && (FIXED.has(e.cat) || catById(e.cat, e.type).group === 'savings' || !!e.rec);
    if ((!income && !fixed) || (income && /^(refund|gift_in|other_in)$/.test(e.cat))) continue;
    const name = (!income && e.merchant ? e.merchant : e.note) || catById(e.cat, e.type).name;
    const key = (income ? 'i' : 'f') + '|' + e.cat + '|' + whoOf(e) + '|' + (ruleKeyFor(e) || normText(name).trim());
    const g = groups.get(key) || { income, cat: e.cat, who: whoOf(e), names: new Map(), amts: [], days: [], months: new Set() };
    g.names.set(name, (g.names.get(name) || 0) + 1); g.amts.push(e.amount); g.days.push(+e.date.slice(8)); g.months.add(e.date.slice(0, 7));
    groups.set(key, g);
  }
  const out = [];
  const known = x => have.concat(out).some(h => h.cat === x.cat && h.who === x.who && Math.abs(h.amount - x.amount) / Math.max(1, x.amount) < 0.25);
  for (const g of groups.values()) {
    if (g.months.size < Math.min(2, months.size)) continue;
    const med = median(g.amts);
    const steady = g.amts.every(a => Math.abs(a - med) <= med * 0.02);
    const amount = steady ? round2(med) : niceRound(med * 1.05);
    const name = cap1(Array.from(g.names.entries()).sort((a, b) => b[1] - a[1])[0][0]).slice(0, 60);
    const x = { kind: g.income ? 'income' : 'fixed', name, cat: g.cat, who: g.who, amount, day: clamp(Math.round(median(g.days)), 1, 31), auto: false };
    if (amount > 0 && !known(x)) out.push(x);
  }
  for (const r of Object.values(recurringItems())) {
    if (!r.active || r.every !== 'monthly') continue;
    const t = r.tpl, x = { kind: t.type === 'income' ? 'income' : 'fixed', name: String(t.note || '').slice(0, 60) || catById(t.cat, t.type).name, cat: t.cat, who: whoOf(t), amount: round2(+t.amount || 0), day: clamp(r.day || 1, 1, 31), auto: false };
    if (x.amount > 0 && !known(x)) out.push(x);
  }
  out.sort((a, b) => (a.kind === b.kind ? b.amount - a.amount : a.kind === 'income' ? -1 : 1));
  const incomeSum = sum(plan.incomes, x => x.amount) + sum(out.filter(x => x.kind === 'income'), x => x.amount);
  return { items: out.slice(0, 16), save: !plan.save && incomeSum > 0 ? niceRound(incomeSum * 0.2) : 0 };
}
function openPlanSuggest() {
  PS = planSuggestions();
  const solo = household().solo;
  const row = (x, i) => '<label class="list-row" style="cursor:pointer"><span style="display:flex;gap:10px;align-items:center;min-width:0"><input type="checkbox" data-ps="' + i + '" checked style="width:18px;height:18px;accent-color:var(--accent);flex:none">' + (solo ? '' : avatarHTML(x.who, 'xs')) +
    '<span style="min-width:0"><span class="t" style="display:block">' + esc(catById(x.cat, x.kind === 'income' ? 'income' : 'expense').emoji + '  ' + x.name) + '</span><span class="m">' + esc((solo ? '' : memberName(x.who) + ' · ') + 'around the ' + ordinal(x.day)) + '</span></span></span><b>' + esc(money(x.amount)) + '</b></label>';
  const inc = PS.items.map((x, i) => [x, i]).filter(p => p[0].kind === 'income'), fix = PS.items.map((x, i) => [x, i]).filter(p => p[0].kind === 'fixed');
  let h = '<p class="sh-lede">Here is what repeats in your entries. Untick anything that isn’t a monthly regular, and change the rest any time.</p>';
  if (inc.length) h += '<p class="lbl-s" style="margin-top:16px">Money in</p>' + inc.map(p => row(p[0], p[1])).join('');
  if (fix.length) h += '<p class="lbl-s" style="margin-top:16px">Fixed costs</p>' + fix.map(p => row(p[0], p[1])).join('');
  if (PS.save) h += '<p class="lbl-s" style="margin-top:16px">Saving goal</p><label class="list-row" style="cursor:pointer"><span style="display:flex;gap:10px;align-items:center"><input type="checkbox" data-ps="save" checked style="width:18px;height:18px;accent-color:var(--accent)">A fifth of what comes in</span><b>' + esc(money(PS.save)) + '</b></label>';
  const any = PS.items.length || PS.save;
  if (!any) h += '<p class="note-box">Nothing repeats often enough yet. Add your income and fixed costs yourself, or come back after a month of entries.</p>';
  openSheet(sheetHead('Fill in the plan') + '<div class="sh-body">' + h + '</div><footer class="sh-foot"><span class="spacer"></span><button type="button" class="btn" data-act="close-sheet">' + (any ? 'Cancel' : 'Close') + '</button>' + (any ? '<button type="button" class="btn primary" data-act="ps-apply">Add to plan</button>' : '') + '</footer>', { label: 'Fill in the plan' });
}
async function planSuggestApply() {
  const p = planRaw();
  for (const el of $$('[data-ps]')) {
    if (!el.checked) continue;
    if (el.dataset.ps === 'save') { p.save = PS.save; continue; }
    const x = PS.items[+el.dataset.ps];
    if (x) (x.kind === 'income' ? p.incomes : p.fixed).push(Object.assign({ id: uid(x.kind === 'income' ? 'i' : 'f') }, x));
  }
  p.sample = false;
  closeSheet();
  try { await savePlan(p); toast('Plan filled in. Tap any line to fine-tune it.'); } catch (e) { toast(storeErrorText(e)); }
}
