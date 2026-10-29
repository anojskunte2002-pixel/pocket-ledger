/* ===================== actions: saving, learning, repeating, examples ===================== */
function storeErrorText(e) {
  const c = e && e.code;
  if (c === 'quota_exceeded') return 'Storage is full. Download a backup, then delete old entries to make room.';
  if (c === 'resource_exhausted') return 'Too many changes at once. Wait a moment and try again.';
  if (c === 'read_only' || c === 'revoked') return 'This ledger is read-only right now. Reload the page to continue.';
  if (c === 'invalid_argument') return 'Only the owner of this ledger can change it.';
  return 'Couldn’t save that. Check your connection and try again.';
}
function ensureSettingsSaved() {
  if (Store.meta.settings || !Store.metaLoaded) return;
  saveSettings({}).catch(() => {});
}
async function saveSettings(patch) {
  await metaReady();
  const cur = Object.assign({}, Store.meta.settings || {});
  delete cur.rev;
  const s = settings();
  const next = Object.assign({ currency: s.currency, startDay: s.startDay, ai: s.ai, voiceAuto: s.voiceAuto, dateOrder: s.dateOrder }, cur, patch);
  await putMeta('settings', next);
}
async function saveBudgets(b) {
  await metaReady();
  const cats = {};
  for (const k in (b.cats || {})) if (+b.cats[k] > 0) cats[k] = round2(+b.cats[k]);
  await putMeta('budgets', { total: +b.total > 0 ? round2(+b.total) : 0, cats, sample: !!b.sample });
}
function recurringRaw() { return Object.assign({}, (Store.meta.recurring && Store.meta.recurring.items) || {}); }
async function saveRecurring(list) {
  await metaReady();
  const items = recurringRaw();
  for (const r of list) items[r.id] = r;
  await putMeta('recurring', { items });
}
async function removeRecurring(ids) {
  await metaReady();
  const items = recurringRaw();
  for (const id of ids) delete items[id];
  await putMeta('recurring', { items });
}
function makeRule(d) {
  const day = +d.date.slice(8);
  return { id: uid('r'), every: d.repeat, day, start: d.date, next: nextOccurrence(d.date, d.repeat, day), active: true,
    tpl: { type: d.type, amount: d.amount, cat: d.cat, note: d.note, merchant: d.merchant || '', method: d.method || '', tags: d.tags || [] } };
}
let materializing = false;
async function materializeRecurring() {
  if (materializing || !Store.ready || Store.readOnly) return;
  materializing = true;
  try {
    const items = recurringItems(), today = todayStr(), now = Date.now();
    const out = [], changed = [];
    for (const id in items) {
      const r = items[id];
      if (!r.active) continue;
      let next = r.next, n = 0;
      while (next <= today && n < 60) {
        const eid = 'r-' + r.id + '-' + next;
        if (!Store.entries.has(eid)) out.push(normEntry(eid, Object.assign({}, r.tpl, { date: next, source: 'recurring', rec: r.id, created: now + n, updated: now + n })));
        next = nextOccurrence(next, r.every, r.day);
        n++;
      }
      if (next !== r.next) changed.push(Object.assign({}, r, { next }));
    }
    if (out.length) await putEntries(out);
    if (changed.length) await saveRecurring(changed);
    if (out.length) toast('Added ' + plural(out.length, 'repeating entry', 'repeating entries') + ' that came due');
  } catch (e) { /* tried again on the next visit */ }
  finally { materializing = false; }
}

/* learned shortcuts: "starbucks" → food */
const RULE_STOP = /^(?:paid|bill|bills|payment|online|order|expense|misc|other|money|cash|upi|card|transfer|entry|bank debit|bank credit|from|to|the)$/;
function ruleKeyFor(e) {
  const src = (e.merchant || '').trim() || e.note || '';
  let k = normText(src).trim().replace(/\b(?:at|from|to|for|on|in|the|a|an|my|with|and|of)\b/g, ' ').replace(/[\d§]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!e.merchant) k = k.split(' ').filter(w => w.length > 1).slice(0, 2).join(' ');
  if (!k || k.length < 3 || RULE_STOP.test(k)) return '';
  return k.slice(0, 40);
}
async function learnRules(pairs) {
  await metaReady();
  const map = Object.assign({}, rulesMap());
  for (const [k, c] of pairs) if (k) map[k] = c;
  const keys = Object.keys(map);
  if (keys.length > 500) for (const k of keys.slice(0, keys.length - 500)) delete map[k];
  await putMeta('rules', { map });
}

async function saveDrafts(drafts, source, quiet) {
  const now = Date.now();
  const entries = [], rules = [], recs = [];
  drafts.forEach((d, i) => {
    let rec = '';
    if (d.repeat) { const r = makeRule(d); recs.push(r); rec = r.id; }
    const e = normEntry(uid('t'), Object.assign({}, d, { source: d.source || source || 'text', rec, created: now + i, updated: now + i, sample: false }));
    entries.push(e);
    if (d.catLocked) { const k = ruleKeyFor(e); if (k) rules.push([k, e.cat]); }
  });
  try {
    await putEntries(entries);
    if (recs.length) await saveRecurring(recs);
    if (rules.length) await learnRules(rules);
    ensureSettingsSaved();
  } catch (e) { toast(storeErrorText(e)); return []; }
  flashIds(entries.map(e => e.id));
  if (!IN_CLAUDE && Store.mode === 'device' && navigator.storage && navigator.storage.persist && !uiFlag('persist-asked')) { uiFlag('persist-asked', true); navigator.storage.persist().catch(() => {}); }
  const sd = settings().startDay;
  const otherPeriod = entries.length && periodKeyFor(entries[0].date, sd) !== UI.period;
  if (!quiet) {
    const label = entries.length === 1 ? addedLabel(entries[0]) : 'Added ' + entries.length + ' entries';
    UI.undo = async () => {
      try { await deleteEntries(entries.map(e => e.id)); if (recs.length) await removeRecurring(recs.map(r => r.id)); toast('Removed'); }
      catch (e) { toast(storeErrorText(e)); }
    };
    const acts = [{ label: 'Undo', run: () => UI.undo && UI.undo() }];
    if (entries.length === 1) acts.push({ label: 'Edit', run: () => { const e = Store.entries.get(entries[0].id); if (e) openEditor(e); } });
    else if (otherPeriod) acts.push({ label: 'Show', run: () => { UI.period = periodKeyFor(entries[0].date, sd); UI.periodTouched = true; setTab('activity'); } });
    toast(label + (otherPeriod && entries.length === 1 ? ' · ' + dayLabel(entries[0].date) : ''), acts, 6500);
  }
  return entries;
}
function addedLabel(e) {
  const c = catById(e.cat, e.type), k = kindOf(e);
  return (e.type === 'income' ? 'Added income ' : 'Added ') + money(e.amount) + ' · ' + c.name + (k === 'invest' ? ' (saving)' : k === 'transfer' ? ' (not spending)' : '');
}
async function updateEntry(prev, next) {
  const e = normEntry(prev.id, Object.assign({}, prev, next, { updated: Math.max(Date.now(), prev.updated + 1) }));
  try { await putEntries([e]); } catch (err) { toast(storeErrorText(err)); return null; }
  flashIds([e.id]);
  if (e.cat !== prev.cat) {
    const key = ruleKeyFor(e);
    if (key) {
      learnRules([[key, e.cat]]).catch(() => {});
      const similar = Array.from(Store.entries.values()).filter(x => x.id !== e.id && x.cat === prev.cat && x.type === e.type && ruleKeyFor(x) === key);
      if (similar.length) {
        toast('Saved. I’ll file “' + key + '” under ' + catById(e.cat).name + ' from now on.', [{ label: 'Move ' + similar.length + ' more', run: async () => {
          try { await putEntries(similar.map(x => normEntry(x.id, Object.assign({}, x, { cat: e.cat, updated: Date.now() })))); toast('Moved ' + plural(similar.length, 'entry', 'entries')); }
          catch (err) { toast(storeErrorText(err)); }
        } }], 8000);
        return e;
      }
      toast('Saved. I’ll file “' + key + '” under ' + catById(e.cat).name + ' from now on.');
      return e;
    }
  }
  toast('Saved');
  return e;
}
async function removeEntry(e) {
  try { await deleteEntries([e.id]); } catch (err) { toast(storeErrorText(err)); return; }
  toast('Deleted ' + e.note, [{ label: 'Undo', run: async () => { try { await putEntries([normEntry(e.id, Object.assign({}, e, { updated: Date.now() }))]); } catch (err) { toast(storeErrorText(err)); } } }], 6500);
}

/* example data */
async function loadExamples() {
  if (hasSamples()) { toast('Example data is already here'); return; }
  const ex = buildExamples();
  try {
    await putEntries(ex);
    const b = budgets();
    if (!b.total && !Object.keys(b.cats).length) await saveBudgets(exampleBudgets());
  } catch (e) { toast(storeErrorText(e)); return; }
  closeSheet();
  toast('Added ' + ex.length + ' example entries. Clear them any time from the banner.');
}
async function clearExamples() {
  const ids = Array.from(Store.entries.values()).filter(e => e.sample).map(e => e.id);
  try {
    if (ids.length) await deleteEntries(ids);
    if (budgets().sample) await saveBudgets({ total: 0, cats: {} });
  } catch (e) { toast(storeErrorText(e)); return; }
  UI.ask = { turns: [], busy: false, ctl: null, live: '', err: '' };
  UI.review = { busy: false, text: '', err: '', ctl: null, key: '' };
  toast('Example data cleared');
}

/* files out */
function csvCell(v) {
  let s = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n']/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function buildCSV() {
  const rows = [['Date', 'Type', 'Amount', 'Currency', 'Category', 'Note', 'Place or person', 'Paid with', 'Tags', 'Added by']];
  for (const e of sortedEntries().slice().reverse()) rows.push([e.date, e.type, e.amount, FMT.cur, catById(e.cat, e.type).name, e.note, e.merchant, e.method, e.tags.join(' '), e.source]);
  return '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
}
function buildBackup() {
  return JSON.stringify({
    app: 'pocket-ledger', version: 1, exported: new Date().toISOString(), currency: FMT.cur,
    settings: Store.meta.settings, budgets: Store.meta.budgets, categories: Store.meta.categories, rules: Store.meta.rules, recurring: Store.meta.recurring,
    entries: sortedEntries().slice().reverse().map(e => Object.assign({ id: e.id }, entryToDoc(e)))
  }, null, 1);
}
async function offerFile(name, data, mime) {
  if (UI.downloads) {
    try { await UI.downloads.save({ filename: name, data }); toast('Saved ' + name); return; }
    catch (e) {
      if (e && e.code === 'declined') return;
      if (e && e.code === 'rate_limited') { toast('A save prompt is already open'); return; }
    }
  }
  if (!IN_CLAUDE) {
    try {
      const blob = new Blob([data], { type: (mime || (/\.json$/.test(name) ? 'application/json' : 'text/csv')) + ';charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast('Downloaded ' + name);
      return;
    } catch (e) { /* fall back to copying */ }
  }
  openCopySheet(name, data, mime);
}
