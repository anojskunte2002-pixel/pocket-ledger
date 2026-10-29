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
  const base = { type: 'expense', amount: 0, cat: '', date: todayStr(), note: '', merchant: '', method: '', repeat: '', tags: [] };
  const d = Object.assign(base, JSON.parse(JSON.stringify(existing || src || {})));
  ED = { isNew: !existing, orig: existing || null, d, autoCat: d.cat, catTouched: false, foreign: opts.foreign || '', source: d.source || 'manual', raw: opts.raw || '' };
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
    '<div class="row2"><label class="field"><span>Date</span><input type="date" id="ed-date" value="' + esc(d.date) + '"></label>' +
    '<label class="field"><span>Place or person</span><input id="ed-merchant" maxlength="60" autocomplete="off" value="' + esc(d.merchant) + '" placeholder="Optional"></label></div>' +
    '<div class="field"><span>Paid with</span><div class="chips" id="ed-methods">' + METHODS.map(m => '<button type="button" class="chip-btn" data-act="ed-method" data-arg="' + esc(m) + '" aria-pressed="' + (d.method === m) + '">' + esc(m) + '</button>').join('') + '</div></div>' +
    (isNew ? '<div class="field"><span>Repeats</span><div class="chips" id="ed-repeat">' + reps.map(r => '<button type="button" class="chip-btn" data-act="ed-repeat" data-arg="' + r[0] + '" aria-pressed="' + ((d.repeat || '') === r[0]) + '">' + r[1] + '</button>').join('') + '</div></div>'
      : rec ? '<p class="cc-sub" style="margin-top:14px">This came from an entry that repeats ' + esc(rec.every) + '. Change or stop it in Settings, under Repeating entries.</p>' : '') +
    '<label class="field"><span>Tags</span><input id="ed-tags" autocomplete="off" value="' + esc((d.tags || []).map(t => '#' + t).join(' ')) + '" placeholder="#trip #work"></label>' +
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
    await updateEntry(prev, { type: d.type, amount: d.amount, cat: d.cat, date: d.date, note: d.note, merchant: d.merchant, method: d.method, tags: d.tags });
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
    ['repeat', 'Add a repeating bill', 'Rent, subscriptions, EMIs', 'new-repeat', true]
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
  if (Store.mode === 'cloud') return ic('cloud') + '<span>Saved to your Claude account and private to you. It follows you to any device where you open this page.</span>';
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
  openSheet(sheetHead('Delete everything?') + '<div class="sh-body"><p class="sh-lede">This removes all ' + plural(Store.entries.size, 'entry', 'entries') + ', budgets, categories, repeating entries and learned shortcuts ' + (Store.mode === 'cloud' ? 'from your account' : 'from this device') + '. It can’t be undone, so download a backup first if you might want them later.</p>' +
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
    ]) + '</section>' +
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
