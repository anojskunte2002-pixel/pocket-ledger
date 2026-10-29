/* ===================== interface: chrome, views, dock ===================== */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const SVG = p => '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>';
const ICON = {
  mic: SVG('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  stop: SVG('<rect x="7" y="7" width="10" height="10" rx="2"/>'),
  plus: SVG('<path d="M12 5v14M5 12h14"/>'),
  camera: SVG('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  x: SVG('<path d="M18 6L6 18M6 6l12 12"/>'),
  search: SVG('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  check: SVG('<path d="M20 6L9 17l-5-5"/>'),
  alert: SVG('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'),
  up: SVG('<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>'),
  down: SVG('<path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/>'),
  trend: SVG('<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>'),
  target: SVG('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  gauge: SVG('<path d="M12 14l4-4"/><path d="M3.3 19a9 9 0 1 1 17.4 0"/>'),
  piggy: SVG('<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M16 14h.01"/>'),
  spark: SVG('<path d="M12 3l1.8 4.6 4.7 1.9-4.7 1.9L12 16l-1.8-4.6-4.7-1.9 4.7-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>'),
  sparkle: SVG('<path d="M12 3l1.8 4.6 4.7 1.9-4.7 1.9L12 16l-1.8-4.6-4.7-1.9 4.7-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>'),
  repeat: SVG('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'),
  receipt: SVG('<path d="M5 3v18l2-1.5L9 21l2-1.5 2 1.5 2-1.5 2 1.5 2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
  calendar: SVG('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'),
  leaf: SVG('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>'),
  pin: SVG('<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  tag: SVG('<path d="M3 12V4h8l9 9-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  cash: SVG('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
  message: SVG('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M7 8h10M7 12h6"/>'),
  file: SVG('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
  pencil: SVG('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  keyboard: SVG('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'),
  cloud: SVG('<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 12 3.5 3.5 0 0 0 6 19z"/>'),
  device: SVG('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'),
  info: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  copy: SVG('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  upload: SVG('<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>')
};
const ic = name => '<span class="ic" aria-hidden="true">' + (ICON[name] || ICON.info) + '</span>';
/* Inside Claude the page gets cloud storage and Claude; as a plain website it keeps data in this browser. */
const IN_CLAUDE = typeof window !== 'undefined' && !!(window.claude && typeof window.claude.use === 'function');
function uiFlag(k, v) { try { if (v === undefined) return localStorage.getItem(LS_PREFIX + 'ui:' + k) === '1'; localStorage.setItem(LS_PREFIX + 'ui:' + k, v ? '1' : '0'); } catch (e) { /* optional */ } return false; }
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

const UI = {
  tab: 'home', period: '', periodTouched: false,
  act: { q: '', type: 'all', cat: '' }, actLimit: 300,
  draft: null, slipOver: {}, busy: false, aiCtl: null,
  undo: null, flash: new Set(), flashTimer: 0,
  ask: { turns: [], busy: false, ctl: null, live: '', err: '' },
  review: { busy: false, text: '', err: '', ctl: null, key: '' },
  tables: {}, mounted: '', insSig: '', downloads: null, permissions: null
};

/* ---------- render loop ---------- */
let renderQ = 0;
function render() { if (renderQ) return; renderQ = requestAnimationFrame(() => { renderQ = 0; renderNow(); }); }
function currentKey() { return periodKeyFor(todayStr(), settings().startDay); }
function renderNow() {
  const st = settings();
  if (FMT.cur !== st.currency) setCurrency(st.currency);
  if (!UI.period || (!UI.periodTouched && UI.period !== currentKey())) UI.period = currentKey();
  renderHeader();
  renderBanner();
  renderView();
  renderSlips();
  syncDockButtons();
}
function periodShortLabel(p) {
  return settings().startDay === 1 ? fmtDate(p.start, { month: 'short', year: 'numeric' }) : shortDate(p.start) + '–' + shortDate(p.end);
}
function renderHeader() {
  const sd = settings().startDay, p = periodFromKey(UI.period, sd), cur = currentKey();
  const lab = $('#period-label');
  lab.innerHTML = '<span class="pl-long">' + esc(periodLabel(p)) + '</span><span class="pl-short">' + esc(periodShortLabel(p)) + '</span>';
  lab.setAttribute('aria-label', UI.period === cur ? 'Showing ' + periodLabel(p) : 'Showing ' + periodLabel(p) + '. Go back to this month');
  $('#next-period').disabled = UI.period >= cur;
  for (const b of $$('.tabs [data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === UI.tab));
}
function bannerHTML(icon, text, tone, extra) {
  return '<div class="banner' + (tone ? ' tone-' + tone : '') + '">' + ic(icon) + '<span>' + text + '</span>' + (extra || '') + '</div>';
}
let SAMPLE_CACHE = { v: -1, has: false };
function hasSamples() {
  if (SAMPLE_CACHE.v !== Store.version) { let h = false; for (const e of Store.entries.values()) if (e.sample) { h = true; break; } SAMPLE_CACHE = { v: Store.version, has: h }; }
  return SAMPLE_CACHE.has;
}
function renderBanner() {
  let h = '';
  if (Store.ready) {
    if (Store.mode === 'device' && !IN_CLAUDE) { if (!uiFlag('device-note')) h += bannerHTML('device', 'Your entries stay private in this browser, on this device. Nothing is sent to a server. Download a backup from Settings now and then.', '', '<button class="link" type="button" data-act="hide-device-note">Got it</button>'); }
    else if (Store.mode === 'device') h += bannerHTML('device', Store.reason === 'not-owner' ? 'This ledger belongs to someone else, so you have your own copy here. It is saved on this device only.' : 'Entries are saved on this device only. Open this page in Claude while signed in to keep them in your account.');
    else if (Store.mode === 'memory') h += bannerHTML('alert', 'This browser is blocking storage, so entries disappear when you close the page. Export a backup before you leave.', 'warn');
    if (Store.error) h += bannerHTML('alert', esc(Store.error), 'warn');
    if (hasSamples()) h += bannerHTML('sparkle', 'You are looking at example data. Your own entries stay when you clear it.', 'info', '<button class="link" type="button" data-act="clear-examples">Clear examples</button>');
  }
  const el = $('#banner');
  if (el.innerHTML !== h) el.innerHTML = h;
}
function renderView() {
  const v = $('#view');
  if (!Store.ready) return;
  const tab = UI.tab;
  if (tab === 'activity') {
    if (UI.mounted !== 'activity') { v.innerHTML = activityShell(); UI.mounted = 'activity'; bindActivity(); }
    updateActivity();
  } else if (tab === 'insights') {
    const sig = aiReady() + '|' + AI.blocked + '|' + AI.tools;
    if (UI.mounted !== 'insights' || UI.insSig !== sig) { v.innerHTML = insightsShell(); UI.mounted = 'insights'; UI.insSig = sig; bindInsights(); }
    updateInsights();
  } else {
    const keepScroll = UI.mounted === tab;
    v.innerHTML = tab === 'budgets' ? budgetsHTML() : homeHTML();
    UI.mounted = tab;
    if (!keepScroll) window.scrollTo(0, 0);
  }
}
function setTab(t) {
  if (['home', 'activity', 'insights', 'budgets'].indexOf(t) < 0) t = 'home';
  if (UI.tab !== t) { UI.tab = t; window.scrollTo(0, 0); }
  if (location.hash !== '#' + t) { try { history.replaceState(null, '', '#' + t); } catch (e) { location.hash = t; } }
  hideTip();
  render();
}
function shiftPeriod(n) {
  const next = shiftKey(UI.period, n);
  if (next > currentKey()) return;
  UI.period = next; UI.periodTouched = next !== currentKey();
  render();
}

/* ---------- rows ---------- */
function rowHTML(e) {
  const c = catById(e.cat, e.type), k = kindOf(e);
  const metaBits = [c.name];
  if (e.merchant && e.note.toLowerCase().indexOf(e.merchant.toLowerCase()) < 0) metaBits.push(e.merchant);
  if (e.method) metaBits.push(e.method);
  if (e.rec) metaBits.push('repeats');
  if (e.tags.length) metaBits.push('#' + e.tags.join(' #'));
  const amt = e.type === 'income' ? money(e.amount, { sign: true }) : money(e.amount);
  const sub = k === 'transfer' ? '<small>not spending</small>' : k === 'invest' ? '<small>saved</small>' : '';
  return '<button type="button" class="row ' + e.type + ' k-' + k + (UI.flash.has(e.id) ? ' flash' : '') + '" data-act="edit" data-arg="' + esc(e.id) + '">' +
    '<span class="badge" aria-hidden="true">' + esc(c.emoji) + '</span>' +
    '<span class="row-main"><span class="row-title">' + esc(e.note) + '</span><span class="row-meta">' + esc(metaBits.join(' · ')) + '</span></span>' +
    '<span class="row-amt">' + amt + sub + '</span></button>';
}
function dayGroupsHTML(list, totals) {
  let h = '', day = '';
  const tot = {};
  if (totals) for (const e of list) { const t = tot[e.date] || (tot[e.date] = { s: 0, i: 0 }); if (kindOf(e) === 'spend') t.s += e.amount; else if (e.type === 'income') t.i += e.amount; }
  for (const e of list) {
    if (e.date !== day) {
      if (day) h += '</div>';
      day = e.date;
      let t = '';
      if (totals) { const x = tot[day], bits = []; if (x.s) bits.push(money(x.s) + ' spent'); if (x.i) bits.push(money(x.i, { sign: true })); t = '<span class="tot">' + esc(bits.join(' · ')) + '</span>'; }
      h += '<div class="day"><div class="day-h"><span>' + esc(dayLabel(day)) + '</span>' + t + '</div>';
    }
    h += rowHTML(e);
  }
  if (day) h += '</div>';
  return h;
}
function flashIds(ids) {
  for (const id of ids) UI.flash.add(id);
  clearTimeout(UI.flashTimer);
  UI.flashTimer = setTimeout(() => { UI.flash.clear(); }, 2200);
}

/* ---------- home ---------- */
function welcomeHTML() {
  const tries = exampleTry();
  const ways = [
    ['keyboard', 'Type it', 'Like a text: “uber 230 yesterday on card”', 'focus-entry'],
    ['mic', 'Say it', 'Tap the mic, or your keyboard’s mic, and talk', 'voice'],
    ['camera', 'Snap a receipt', 'Photos and payment screenshots', 'scan'],
    ['message', 'Paste bank messages', 'SMS or e-mail alerts, many at once', 'import-sms'],
    ['file', 'Import a statement', 'CSV from your bank or card', 'import-csv'],
    ['pencil', 'Fill in a form', 'Pick the category yourself', 'new-entry']
  ].filter(w => w[3] !== 'scan' || (aiReady() && AI.images));
  return '<section class="welcome">' +
    '<p class="eyebrow">Your money, one line at a time</p>' +
    '<h1>Track money by just saying it.</h1>' +
    '<p class="lede">Type or speak the way you would text a friend. Pocket Ledger finds the amount, the date, how you paid and the right category, then turns it all into budgets and insights.</p>' +
    '<div class="try"><span class="lbl-s">Tap one to try it</span><div class="try-row">' + tries.map(t => '<button type="button" class="try-chip" data-act="try" data-arg="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div></div>' +
    '<ul class="ways">' + ways.map(w => '<li><button type="button" class="way" data-act="' + w[3] + '">' + ic(w[0]) + '<b>' + w[1] + '</b><span>' + w[2] + '</span></button></li>').join('') + '</ul>' +
    '<div class="welcome-cta"><button type="button" class="btn" data-act="examples">' + ic('sparkle') + 'Explore with example data</button><span class="muted">Clearly marked, and gone with one tap.</span></div>' +
    '</section>';
}
function homeHTML() {
  if (!Store.entries.size) return welcomeHTML();
  const A = analyze(UI.period);
  return heroHTML(A) + topInsightsHTML(A) + recentHTML(A);
}
function heroHTML(A) {
  const b = A.budgetTotal;
  let chip = '', meter = '', sub = '';
  const daysIncl = A.daysLeft + 1;
  if (b) {
    const left = b - A.spend;
    let tone = 'good', label = A.isCurrent ? 'On track' : 'Under budget';
    if (left < 0) { tone = 'bad'; label = 'Over budget'; }
    else if (A.isCurrent && A.dayIndex >= 3 && A.projection > b * 1.02) { tone = 'warn'; label = 'Spending fast'; }
    chip = '<span class="chip tone-' + tone + '">' + ic(tone === 'good' ? 'check' : 'alert') + label + '</span>';
    const pace = A.isCurrent ? A.dayIndex / A.p.days : 0;
    meter = '<div class="meter tone-' + tone + '" role="meter" aria-label="Budget used" aria-valuemin="0" aria-valuemax="' + Math.round(b) + '" aria-valuenow="' + Math.round(A.spend) + '" aria-valuetext="' + esc(money(A.spend) + ' of ' + money(b)) + '">' +
      '<span style="width:' + Math.min(100, A.spend / b * 100).toFixed(1) + '%"></span>' +
      (A.isCurrent ? '<i class="pace" style="left:' + (pace * 100).toFixed(1) + '%" title="Even pace for today"></i>' : '') + '</div>';
    sub = left >= 0
      ? esc(money(left)) + ' left of ' + esc(money(b)) + (A.isCurrent ? ' · about ' + esc(moneyR(left / daysIncl)) + ' a day for ' + plural(daysIncl, 'day') : '')
      : esc(money(-left)) + ' over your ' + esc(money(b)) + ' budget';
  } else {
    sub = '<button type="button" class="link" data-act="tab" data-arg="budgets">Set a monthly budget</button> to see if you are on pace.';
  }
  const stats = [];
  stats.push(['Income', A.income ? '<span class="in">' + esc(money(A.income)) + '</span>' : esc(money(0))]);
  if (A.income > 0) stats.push(['Saved', esc(money(A.saved)) + ' <small>' + pct(A.savingsRate) + '</small>']);
  else stats.push(['Invested', esc(money(A.invest))]);
  if (A.isCurrent && A.dayIndex >= 3) stats.push(['Projected', esc(money(niceRound(A.projection)))]);
  else stats.push(['Per day', esc(money(Math.round(A.avgPerDay)))]);
  return '<section class="hero card">' +
    '<div class="hero-top"><span class="eyebrow">Spent ' + (A.isCurrent ? 'this month' : 'in ' + esc(periodLabel(A.p))) + '</span>' + chip + '</div>' +
    '<div class="hero-num">' + esc(money(A.spend)) + '</div>' + meter +
    '<p class="hero-sub">' + sub + '</p>' +
    '<dl class="hero-stats">' + stats.map(s => '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>').join('') + '</dl>' +
    '</section>';
}
function insightItemHTML(x) {
  const toneWord = { good: 'Good', warn: 'Heads up', bad: 'Alert', info: '' }[x.tone] || '';
  return '<li class="ins tone-' + x.tone + '"><span class="ins-ic" aria-hidden="true">' + (ICON[x.icon] || ICON.info) + '</span>' +
    '<p class="ins-t">' + (toneWord ? '<span class="tone-tag">' + toneWord + '</span>' : '') + esc(x.title) + '</p><p class="ins-b">' + esc(x.body) + '</p>' +
    (x.action ? '<button type="button" class="link" data-act="' + esc(x.action.act) + '" data-arg="' + esc(x.action.arg) + '">' + esc(x.action.label) + '</button>' : '') + '</li>';
}
function topInsightsHTML(A) {
  const list = A.insights.slice(0, 3);
  if (!list.length) return '';
  return '<section class="sec"><div class="sec-head"><h2 class="sec-h">What stands out</h2>' + (A.insights.length > 3 ? '<button type="button" class="link" data-act="tab" data-arg="insights">All insights</button>' : '') + '</div><ul class="insights">' + list.map(insightItemHTML).join('') + '</ul></section>';
}
function recentHTML(A) {
  const list = (A.isCurrent ? sortedEntries() : A.entries).slice(0, 8);
  const body = list.length ? dayGroupsHTML(list, false) : '<div class="empty"><h3>Nothing logged in ' + esc(periodLabel(A.p)) + '</h3><p>Entries you add for these dates show up here.</p></div>';
  return '<section class="sec"><div class="sec-head"><h2 class="sec-h">' + (A.isCurrent ? 'Latest entries' : 'Entries') + '</h2><button type="button" class="link" data-act="tab" data-arg="activity">See all</button></div>' + body + '</section>';
}

/* ---------- activity ---------- */
function activityShell() {
  const types = [['all', 'All'], ['expense', 'Spending'], ['income', 'Income']];
  return '<section class="act"><div class="filters">' +
    '<label class="search">' + ic('search') + '<span class="sr">Search entries</span><input id="act-q" type="search" placeholder="Search notes, places, #tags or amounts" autocomplete="off" enterkeyhint="search"></label>' +
    '<div class="filter-row"><div class="chips" role="group" aria-label="Show">' + types.map(t => '<button type="button" class="chip-btn" data-act="act-type" data-arg="' + t[0] + '" aria-pressed="false">' + t[1] + '</button>').join('') + '</div>' +
    '<select id="act-cat" class="select" aria-label="Category"></select></div></div>' +
    '<div id="act-sum" class="act-sum"></div><div id="act-list"></div></section>';
}
function bindActivity() {
  const q = $('#act-q');
  q.value = UI.act.q;
  q.addEventListener('input', () => { UI.act.q = q.value; UI.actLimit = 300; updateActivity(); });
  $('#act-cat').addEventListener('change', ev => { UI.act.cat = ev.target.value; UI.actLimit = 300; updateActivity(); });
}
function matchQuery(e, q) {
  if (/^[\d.,₹$€£\s]+$/.test(q)) {
    const n = parseFloat(q.replace(/[^\d.]/g, ''));
    if (n > 0) return Math.abs(e.amount - n) < 0.005 || String(e.amount).indexOf(String(n)) === 0;
  }
  const hay = (e.note + ' ' + e.merchant + ' ' + e.method + ' ' + catById(e.cat, e.type).name + ' ' + e.tags.map(t => '#' + t).join(' ')).toLowerCase();
  return q.split(/\s+/).every(w => hay.indexOf(w) >= 0);
}
function activityList() {
  const q = UI.act.q.trim().toLowerCase();
  let list = sortedEntries();
  if (!q) { const p = periodFromKey(UI.period, settings().startDay); list = list.filter(e => e.date >= p.start && e.date <= p.end); }
  if (UI.act.type !== 'all') list = list.filter(e => e.type === UI.act.type);
  if (UI.act.cat) list = list.filter(e => e.cat === UI.act.cat);
  if (q) list = list.filter(e => matchQuery(e, q));
  return list;
}
function updateActivity() {
  const sel = $('#act-cat');
  if (!sel) return;
  const cats = allCats();
  const sig = cats.map(c => c.id + c.name + c.emoji + (c.hidden ? 'h' : '')).join('|');
  if (sel.dataset.sig !== sig) {
    sel.innerHTML = '<option value="">All categories</option>' + cats.filter(c => !c.hidden || c.id === UI.act.cat).map(c => '<option value="' + esc(c.id) + '">' + esc(c.emoji + '  ' + c.name) + '</option>').join('');
    sel.dataset.sig = sig;
  }
  sel.value = UI.act.cat;
  for (const b of $$('[data-act="act-type"]')) b.setAttribute('aria-pressed', String(b.dataset.arg === UI.act.type));
  const list = activityList();
  const spent = sum(list.filter(e => kindOf(e) === 'spend'), e => e.amount), inc = sum(list.filter(e => e.type === 'income'), e => e.amount);
  const p = periodFromKey(UI.period, settings().startDay);
  $('#act-sum').innerHTML = list.length ? '<span>' + plural(list.length, 'entry', 'entries') + (UI.act.q.trim() ? ' · searching all dates' : ' · ' + esc(periodLabel(p))) + '</span><span>Spent <b>' + esc(money(spent)) + '</b>' + (inc ? ' · Income <b class="in">' + esc(money(inc)) + '</b>' : '') + '</span>' : '';
  const shown = list.slice(0, UI.actLimit);
  let h;
  if (!list.length) {
    h = UI.act.q.trim() || UI.act.cat || UI.act.type !== 'all'
      ? '<div class="empty"><h3>No entries match</h3><p>Try fewer words, or clear the filters.</p><button type="button" class="btn" data-act="act-clear">Clear filters</button></div>'
      : '<div class="empty"><h3>Nothing logged in ' + esc(periodLabel(p)) + '</h3><p>Add one below, like <b>' + esc(exampleTry()[0]) + '</b>.</p></div>';
  } else {
    h = dayGroupsHTML(shown, true);
    if (list.length > shown.length) h += '<button type="button" class="btn more" data-act="act-more">Show ' + Math.min(300, list.length - shown.length) + ' more</button>';
    else h += '<div class="grand"><span>Total spent</span><span class="v">' + esc(money(spent)) + '</span></div>';
  }
  $('#act-list').innerHTML = h;
}

/* ---------- insights ---------- */
function askIntroHTML() {
  if (!AI.ok && !IN_CLAUDE) return '<p class="sh-lede">Answers to questions, receipt reading and help with tricky entries come with the Claude version of Pocket Ledger. Every chart and insight below works right here.</p>';
  if (!AI.ok) return '<p class="sh-lede">Questions about your money are answered by Claude. That isn’t available in this view, but every chart and insight below works without it.</p>';
  if (AI.blocked === 'not_granted') return '<p class="sh-lede">Claude access is off for this page.</p><div class="sugg"><button type="button" class="btn" data-act="open-permissions">Turn on Claude access</button></div>';
  if (AI.blocked) return '<p class="sh-lede">' + esc(aiErrorText({ code: AI.blocked })) + '</p>';
  if (settings().ai === 'off') return '<p class="sh-lede">Smart features are switched off in Settings.</p><div class="sugg"><button type="button" class="btn" data-act="settings">Open settings</button></div>';
  return '';
}
function insightsShell() {
  const intro = askIntroHTML();
  const ask = intro ? intro : '<div id="ask-review"></div><div id="ask-log" class="ask-log" aria-live="polite"></div>' +
    '<form id="ask-form" class="ask-form"><label class="sr" for="ask-q">Ask a question</label><input id="ask-q" placeholder="Ask anything about your money" autocomplete="off" enterkeyhint="send"><button type="submit" class="btn primary" id="ask-go">Ask</button></form>' +
    '<div class="sugg" id="ask-sugg"></div>';
  return '<div id="ins-kpis"></div><section class="card ask" id="ask"><div class="ask-head"><h2 class="sec-h">Ask about your money</h2>' + (intro ? '' : '<button type="button" class="link" data-act="review">Write my month in review</button>') + '</div>' + ask + '</section><div id="ins-body"></div>';
}
function bindInsights() {
  const f = $('#ask-form');
  if (f) f.addEventListener('submit', ev => { ev.preventDefault(); const q = $('#ask-q'); const v = q.value; q.value = ''; askSubmit(v); });
}
function kpiHTML(label, value, delta) {
  return '<div class="card kpi"><div class="kpi-l">' + label + '</div><div class="kpi-v">' + value + '</div>' + (delta ? '<div class="kpi-d ' + (delta.tone || '') + '">' + delta.text + '</div>' : '<div class="kpi-d">&nbsp;</div>') + '</div>';
}
function deltaText(now, then, upIsBad, versus) {
  if (!(then > 0)) return null;
  const d = (now - then) / then;
  if (Math.abs(d) < 0.005) return { text: 'Same as ' + versus };
  const up = d > 0;
  return { text: (up ? '▲ ' : '▼ ') + pct(Math.abs(d)) + ' vs ' + versus, tone: up === upIsBad ? 'bad' : 'good' };
}
function kpisHTML(A) {
  const versus = A.isCurrent ? 'same day last month' : 'the month before';
  const spendRef = A.isCurrent ? A.prevToDate : A.prevSpend;
  return '<div class="kpis">' +
    kpiHTML('Spent', esc(money(A.spend)), deltaText(A.spend, spendRef, true, versus)) +
    kpiHTML('Income', esc(money(A.income)), A.isCurrent ? null : deltaText(A.income, A.prevIncome, false, 'the month before')) +
    kpiHTML('Saved', A.income > 0 ? esc(money(A.saved)) : '–', A.income > 0 ? { text: pct(A.savingsRate) + ' of income', tone: A.savingsRate >= 0.2 ? 'good' : A.savingsRate < 0 ? 'bad' : '' } : { text: 'Log income to see this' }) +
    kpiHTML('Per day', esc(money(Math.round(A.avgPerDay))), A.isCurrent && A.dayIndex ? { text: 'over ' + plural(A.dayIndex, 'day') } : null) +
    '</div>';
}
function chartCard(id, title, sub, legend, inner, tableHTML) {
  const showTable = !!UI.tables[id];
  return '<section class="card cc"><div class="cc-head"><div><h3>' + title + '</h3>' + (sub ? '<p class="cc-sub">' + sub + '</p>' : '') + '</div>' +
    (tableHTML ? '<button type="button" class="tbl-toggle" data-act="toggle-table" data-arg="' + id + '" aria-pressed="' + showTable + '">' + (showTable ? 'Chart' : 'Table') + '</button>' : '') + '</div>' +
    (legend && !showTable ? '<ul class="legend">' + legend + '</ul>' : '') +
    (showTable ? '<div class="tbl-wrap">' + tableHTML + '</div>' : inner) + '</section>';
}
const keyLine = (color, label, dashed) => '<li><i class="key-line' + (dashed ? ' dashed' : '') + '" style="--k:' + color + '"></i>' + label + '</li>';
const keyRect = (color, label) => '<li><i class="key-rect" style="--k:' + color + '"></i>' + label + '</li>';
function categoryBarsHTML(A) {
  const rows = Array.from(A.byCat.entries()).filter(([, v]) => v.kind === 'spend' || v.kind === 'invest').sort((a, b) => b[1].total - a[1].total);
  if (!rows.length) return '<p class="muted">No spending yet in this period.</p>';
  const max = rows[0][1].total;
  return '<div class="cbars">' + rows.map(([id, v]) => {
    const c = catById(id);
    const avg = A.avgCat.get(id) || 0;
    const expected = A.isCurrent ? avg * (A.dayIndex / A.p.days) : avg;
    let delta = '';
    if (v.kind === 'spend' && A.priorCount >= 1 && expected > 0) {
      const d = v.total / expected - 1;
      if (Math.abs(d) >= 0.1) delta = ' <span class="delta ' + (d > 0 ? 'bad' : 'good') + '">' + (d > 0 ? '▲ ' : '▼ ') + pct(Math.abs(d)) + '</span>';
    }
    const share = v.kind === 'spend' && A.spend > 0 ? pct(v.total / A.spend) + ' of spending' : 'saved, not counted as spending';
    const bud = A.budgetCats[id] ? ' · budget ' + money(A.budgetCats[id]) : '';
    return '<button type="button" class="cbar" data-act="filter-cat" data-arg="' + esc(id) + '"><span class="cbar-name"><span aria-hidden="true">' + esc(c.emoji) + '</span>' + esc(c.name) + '</span><span class="cbar-val">' + esc(money(v.total)) + delta + '</span>' +
      '<span class="cbar-track"><span class="cbar-fill" style="width:' + Math.max(1.5, v.total / max * 100).toFixed(1) + '%"></span></span>' +
      '<span class="cbar-sub">' + esc(share + ' · ' + plural(v.count, 'entry', 'entries') + bud) + '</span></button>';
  }).join('') + '</div>';
}
function nwsHTML(A) {
  const inc = A.income;
  const saved = inc > 0 ? Math.max(0, inc - A.needs - A.wants) : A.invest;
  const total = inc > 0 ? Math.max(inc, A.needs + A.wants) : A.needs + A.wants + A.invest;
  if (total <= 0) return '<p class="muted">Log some spending to see the split.</p>';
  const segs = [['s1', 'Needs', A.needs, 'rent, bills, groceries, transport, health'], ['s2', 'Wants', A.wants, 'eating out, shopping, fun, travel'], ['s3', inc > 0 ? 'Saved' : 'Invested', saved, inc > 0 ? 'income not spent, investments included' : 'SIPs, deposits and investments']];
  return '<div class="nws-bar" role="img" aria-label="' + esc(segs.map(s => s[1] + ' ' + pct(s[2] / total)).join(', ')) + '">' + segs.filter(s => s[2] > 0).map(s => '<span class="' + s[0] + '" style="flex:' + s[2].toFixed(2) + '"></span>').join('') + '</div>' +
    '<ul class="nws-legend">' + segs.map(s => '<li><i class="key-rect ' + s[0] + '"></i><span>' + s[1] + ' <span class="muted">· ' + s[3] + '</span></span><b>' + esc(money(s[2])) + ' · ' + pct(s[2] / total) + '</b></li>').join('') + '</ul>' +
    '<p class="cc-sub" style="margin-top:10px">A common guideline is 50% needs, 30% wants and 20% saved.</p>';
}
function methodsHTML(A) {
  if (!A.methods.length) return '<p class="muted">Nothing yet.</p>';
  const max = A.methods[0].total;
  return '<div class="cbars">' + A.methods.map(m => '<div class="cbar" style="cursor:default"><span class="cbar-name">' + esc(m.name) + '</span><span class="cbar-val">' + esc(money(m.total)) + '</span><span class="cbar-track"><span class="cbar-fill" style="width:' + Math.max(1.5, m.total / max * 100).toFixed(1) + '%"></span></span></div>').join('') + '</div>';
}
function placesHTML(A) {
  if (!A.topPlaces.length) return '<p class="muted">Nothing yet.</p>';
  return '<ul class="plain">' + A.topPlaces.map(p => '<li><span>' + esc(p.name) + '</span><b>' + esc(money(p.total)) + '</b><span class="m">' + esc(plural(p.count, 'time') + ' · ' + catById(p.cat).name) + '</span></li>').join('') + '</ul>';
}
function subsHTML(A) {
  if (!A.subs.length) return '<p class="muted">Charges that repeat every month show up here, from repeating entries or ones I spot in your history.</p>';
  const every = { weekly: 'every week', monthly: 'every month', yearly: 'every year' };
  return '<ul class="plain">' + A.subs.slice(0, 10).map(s => '<li><span>' + esc(s.name) + '</span><b>' + esc(moneyR(s.monthly)) + '<span class="muted"> /mo</span></b><span class="m">' + esc(money(s.amount) + ' ' + every[s.every] + (s.next ? ' · next ' + shortDate(s.next) : '') + (s.rule ? '' : ' · spotted in history')) + '</span></li>').join('') +
    '<li><span><b>Total</b></span><b>' + esc(moneyR(sum(A.subs, s => s.monthly))) + '<span class="muted"> /mo</span></b><span class="m">' + esc(moneyR(sum(A.subs, s => s.monthly) * 12)) + ' a year</span></li></ul>';
}
function updateInsights() {
  const A = analyze(UI.period);
  $('#ins-kpis').innerHTML = Store.entries.size ? kpisHTML(A) : '';
  renderAsk();
  const body = $('#ins-body');
  if (!Store.entries.size) {
    body.innerHTML = '<div class="empty"><h3>Insights appear as you log</h3><p>Add a few entries, or explore with example data to see what this page can tell you.</p><button type="button" class="btn" data-act="examples">' + ic('sparkle') + 'Explore with example data</button></div>';
    return;
  }
  const pl = esc(periodLabel(A.p));
  let h = '';
  if (A.insights.length) h += '<section class="sec"><h2 class="sec-h">What stands out</h2><ul class="insights" style="margin-top:8px">' + A.insights.map(insightItemHTML).join('') + '</ul></section>';
  h += '<section class="sec"><h2 class="sec-h">Where your money went</h2>';
  h += chartCard('pace', 'Running total', A.isCurrent ? 'Spending so far this month against last month' + (A.budgetTotal ? ' and your budget' : '') : 'How spending built up through ' + pl,
    keyLine('var(--series-1)', 'This month') + (A.isCurrent && A.dayIndex < A.p.days ? keyLine('var(--series-1)', 'Projected', true) : '') + keyLine('var(--muted-line)', 'Last month') + (A.budgetTotal ? keyLine('var(--budget-line)', 'Budget') : ''),
    '<div class="chart" data-chart="pace"></div>', paceTable(A));
  h += chartCard('cats', 'By category', 'Tap a category to see its entries' + (A.priorCount ? '. Arrows compare with your usual pace.' : '.'), '', categoryBarsHTML(A), '');
  h += chartCard('trend', 'Month by month', 'Spending and income for up to six months', keyRect('var(--series-1)', 'Spent') + keyRect('var(--series-3)', 'Income'), '<div class="chart" data-chart="trend"></div>', trendTable(A));
  h += '</section><section class="sec"><h2 class="sec-h">Habits</h2><div class="grid2">';
  h += chartCard('heat', 'Day by day', 'Darker days cost more', '', heatmapHTML(A), '');
  h += chartCard('weekday', 'Weekday rhythm', 'Average day-to-day spend over the last 13 weeks, without rent and bills', '', '<div class="chart" data-chart="weekday"></div>', weekdayTable(A));
  h += chartCard('nws', 'Needs, wants and saving', inA(A), '', nwsHTML(A), '');
  h += chartCard('methods', 'How you paid', 'Spending and investing by payment method', '', methodsHTML(A), '');
  h += chartCard('places', 'Top places', 'Where you spent the most', '', placesHTML(A), '');
  h += chartCard('subs', 'Repeating charges', 'Subscriptions and bills, as a monthly cost', '', subsHTML(A), '');
  h += '</div></section>';
  body.innerHTML = h;
  drawCharts(A);
}
function inA(A) { return A.income > 0 ? 'Share of your income ' + (A.isCurrent ? 'this month' : 'in ' + esc(periodLabel(A.p))) : 'Share of your outflow, since no income is logged'; }
function drawCharts(A) {
  for (const el of $$('#ins-body .chart[data-chart]')) {
    const k = el.dataset.chart;
    if (k === 'pace') paceChart(el, A);
    else if (k === 'trend') trendChart(el, A);
    else if (k === 'weekday') weekdayChart(el, A);
  }
  bindHeatmap($('#ins-body'), A);
}

/* ---------- ask Claude ---------- */
function askSuggestions() {
  return ['Where did most of my money go this month?', 'How does this month compare with last month?', 'Where can I cut back without much pain?', 'How much did I spend on food in the last 3 months?', 'Can I afford a ' + money(exAmount(20000, 1200)) + ' trip next month?'];
}
function renderAsk() {
  const log = $('#ask-log');
  if (!log) return;
  let h = '';
  for (const t of UI.ask.turns) h += t.role === 'user' ? '<div class="q">' + esc(t.content) + '</div>' : '<div class="a">' + mdLite(t.content) + '</div>';
  if (UI.ask.busy) h += UI.ask.live ? '<div class="a">' + mdLite(UI.ask.live) + '</div>' : '<div class="thinking"><i></i><i></i><i></i>Looking at your numbers…</div>';
  if (UI.ask.err) h += '<p class="err">' + esc(UI.ask.err) + '</p>';
  log.innerHTML = h;
  const go = $('#ask-go');
  if (go) { go.textContent = UI.ask.busy ? 'Stop' : 'Ask'; go.type = UI.ask.busy ? 'button' : 'submit'; go.dataset.act = UI.ask.busy ? 'ask-stop' : ''; }
  const sg = $('#ask-sugg');
  if (sg) sg.innerHTML = UI.ask.turns.length ? (UI.ask.turns.length && !UI.ask.busy ? '<button type="button" class="chip-btn" data-act="ask-clear">Start over</button>' : '') : askSuggestions().map(s => '<button type="button" class="chip-btn" data-act="ask-sugg" data-arg="' + esc(s) + '">' + esc(s) + '</button>').join('');
  const rv = $('#ask-review');
  if (rv) {
    const r = UI.review;
    rv.innerHTML = r.busy || r.text || r.err ? '<div class="review"><div class="rv-h"><span class="eyebrow">Month in review</span>' + (r.busy ? '<button type="button" class="link" data-act="review-stop">Stop</button>' : r.text ? '<button type="button" class="link" data-act="review-refresh">Rewrite</button>' : '') + '</div>' +
      (r.text ? '<div class="a">' + mdLite(r.text) + '</div>' : r.busy ? '<div class="thinking"><i></i><i></i><i></i>Reading the month… this can take a little while.</div>' : '') + (r.err ? '<p class="err">' + esc(r.err) + '</p>' : '') + '</div>' : '';
  }
}
async function askSubmit(q) {
  q = String(q || '').trim();
  if (!q || UI.ask.busy || !aiReady()) return;
  const A = analyze(UI.period);
  UI.ask.turns.push({ role: 'user', content: q.slice(0, 800) });
  UI.ask.busy = true; UI.ask.live = ''; UI.ask.err = '';
  UI.ask.ctl = new AbortController();
  renderAsk();
  try {
    const res = await aiAsk(UI.ask.turns.slice(-12), A, ({ text }) => { UI.ask.live = text; renderAsk(); }, UI.ask.ctl.signal);
    UI.ask.turns.push({ role: 'assistant', content: res.text });
  } catch (e) {
    aiNoteError(e);
    if (e && e.text) UI.ask.turns.push({ role: 'assistant', content: e.text + (e.code === 'cancelled' ? '' : '\n\n*Interrupted. Ask again to retry.*') });
    else if (!e || e.code !== 'cancelled') UI.ask.err = aiErrorText(e);
  } finally {
    UI.ask.busy = false; UI.ask.live = ''; UI.ask.ctl = null;
    renderAsk();
  }
}
async function runReview(refresh) {
  if (UI.review.busy || !aiReady()) return;
  const A = analyze(UI.period);
  UI.review = { busy: true, text: '', err: '', ctl: new AbortController(), key: UI.period };
  renderAsk();
  try {
    const r = await aiReview(A, ({ text }) => { UI.review.text = text; renderAsk(); }, UI.review.ctl.signal, refresh);
    UI.review.text = r.text;
  } catch (e) {
    aiNoteError(e);
    if (e && e.text) UI.review.text = e.text; else if (!e || e.code !== 'cancelled') UI.review.err = aiErrorText(e);
  } finally { UI.review.busy = false; UI.review.ctl = null; renderAsk(); }
}

/* ---------- budgets ---------- */
function budgetsHTML() {
  const A = analyze(UI.period), b = budgets();
  let h = '';
  if (b.total) {
    const left = b.total - A.spend, tone = left < 0 ? 'bad' : (A.isCurrent && A.dayIndex >= 3 && A.projection > b.total * 1.02 ? 'warn' : 'good');
    h += '<section class="hero card"><div class="hero-top"><span class="eyebrow">Monthly budget</span><button type="button" class="link" data-act="budget-edit" data-arg="">Change</button></div>' +
      '<div class="hero-num">' + esc(money(b.total)) + '</div>' +
      '<div class="meter tone-' + tone + '" role="meter" aria-label="Budget used" aria-valuemin="0" aria-valuemax="' + Math.round(b.total) + '" aria-valuenow="' + Math.round(A.spend) + '"><span style="width:' + Math.min(100, A.spend / b.total * 100).toFixed(1) + '%"></span>' + (A.isCurrent ? '<i class="pace" style="left:' + (A.dayIndex / A.p.days * 100).toFixed(1) + '%" title="Even pace for today"></i>' : '') + '</div>' +
      '<p class="hero-sub">' + esc(money(A.spend)) + ' spent · ' + (left >= 0 ? esc(money(left)) + ' left' : esc(money(-left)) + ' over') + (A.isCurrent && left > 0 ? ' · ' + esc(moneyR(left / (A.daysLeft + 1))) + ' a day for the rest of the month' : '') + '</p>' +
      (A.isCurrent && A.dayIndex >= 3 ? '<p class="hero-sub">At this pace the month ends near <b>' + esc(money(niceRound(A.projection))) + '</b>.</p>' : '') + '</section>';
  } else {
    h += '<section class="hero card"><span class="eyebrow">Monthly budget</span><h2 class="sec-h" style="margin-top:8px">Give your month a limit</h2>' +
      '<p class="hero-sub">A budget turns on pace tracking, daily allowances and early warnings.' + (A.avgSpend > 0 ? ' You usually spend about <b>' + esc(money(niceRound(A.avgSpend))) + '</b> a month.' : '') + '</p>' +
      '<div class="welcome-cta"><button type="button" class="btn primary" data-act="budget-edit" data-arg="">Set monthly budget</button>' + (A.priorCount || A.count > 10 ? '<button type="button" class="btn" data-act="budget-suggest">' + ic('sparkle') + 'Suggest from my spending</button>' : '') + '</div></section>';
  }
  const ids = Object.keys(b.cats);
  h += '<section class="sec"><div class="sec-head"><h2 class="sec-h">Category budgets</h2>' + (ids.length && (A.priorCount || A.count > 10) ? '<button type="button" class="link" data-act="budget-suggest">Suggest</button>' : '') + '</div>';
  if (!ids.length) h += '<p class="muted">Set limits for the categories you want to watch, like eating out or shopping.</p>';
  for (const id of ids.sort((x, y) => b.cats[y] - b.cats[x])) {
    const c = catById(id), lim = b.cats[id], v = A.byCat.get(id), spent = v ? v.total : 0, left = lim - spent;
    const tone = left < 0 ? 'bad' : (A.isCurrent && spent / lim > A.dayIndex / A.p.days + 0.15 && spent / lim >= 0.6 ? 'warn' : 'good');
    h += '<button type="button" class="bud-row" data-act="budget-edit" data-arg="' + esc(id) + '"><span class="badge" aria-hidden="true">' + esc(c.emoji) + '</span><span class="t">' + esc(c.name) + '</span><span class="v">' + esc(money(spent)) + ' <span class="muted">/ ' + esc(money(lim)) + '</span></span>' +
      '<span class="meter sm tone-' + tone + '" aria-hidden="true"><span style="width:' + Math.min(100, spent / lim * 100).toFixed(1) + '%"></span>' + (A.isCurrent ? '<i class="pace" style="left:' + (A.dayIndex / A.p.days * 100).toFixed(1) + '%"></i>' : '') + '</span>' +
      '<span class="m">' + (left >= 0 ? esc(money(left)) + ' left' : esc(money(-left)) + ' over') + (tone === 'warn' ? ' · ahead of pace' : '') + '</span></button>';
  }
  h += '<div class="welcome-cta"><button type="button" class="btn" data-act="budget-add">' + ic('plus') + 'Add a category budget</button></div></section>';
  h += '<section class="sec"><p class="muted">Budgets repeat every month. Savings and investments, card bill payments and transfers never count against them. You can also type <b>budget food 8000</b> in the box below.</p></section>';
  return h;
}

/* ---------- toast ---------- */
let toastTimer = 0;
function toast(msg, actions, ms) {
  if (!msg) return;
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  const t = document.createElement('span');
  t.textContent = msg;
  el.appendChild(t);
  const done = () => { clearTimeout(toastTimer); if (el.parentNode) el.parentNode.removeChild(el); };
  for (const a of actions || []) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = a.label;
    b.addEventListener('click', () => { done(); a.run(); });
    el.appendChild(b);
  }
  root.textContent = '';
  root.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(done, ms || 4200);
}

/* ---------- dock: live preview of what will be saved ---------- */
let parseTimer = 0;
function autosize() { const t = $('#entry'); t.style.height = 'auto'; t.style.height = Math.min(136, t.scrollHeight) + 'px'; updateDockHeight(); }
function updateDockHeight() { const d = $('#dock'); if (d) document.documentElement.style.setProperty('--dock-h', d.offsetHeight + 'px'); }
function syncDockButtons() {
  const has = $('#entry').value.trim().length > 0;
  $('#send-btn').hidden = !has || Voice.on;
  $('#mic-btn').hidden = has && !Voice.on;
}
function onEntryInput() {
  autosize();
  syncDockButtons();
  hideCoach();
  UI.slipOver = {};
  clearTimeout(parseTimer);
  parseTimer = setTimeout(() => { UI.draft = parseText($('#entry').value, parseCtx()); renderSlips(); }, 80);
}
function slipHTML(d, i) {
  const c = catById(d.cat, d.type), k = kindOf(d);
  const meta = [];
  if (d.date !== todayStr()) meta.push(dayLabel(d.date));
  if (d.method) meta.push(d.method);
  if (d.repeat) meta.push('repeats ' + d.repeat);
  if (d.tags && d.tags.length) meta.push('#' + d.tags.join(' #'));
  if (k === 'invest') meta.push('counts as saving');
  if (k === 'transfer') meta.push('not counted as spending');
  return '<div class="slip ' + d.type + (UI.busy ? ' busy' : '') + '">' +
    '<button type="button" class="slip-cat" data-act="slip-cat" data-arg="' + i + '" aria-label="Category ' + esc(c.name) + '. Change category"><span aria-hidden="true">' + esc(c.emoji) + '</span>' + esc(c.name) + '</button>' +
    '<button type="button" class="slip-main" data-act="slip-edit" data-arg="' + i + '" aria-label="Edit before saving"><span class="slip-note">' + esc(d.note) + '</span>' + (meta.length ? '<span class="slip-meta">' + meta.map(m => '<span>' + esc(m) + '</span>').join('') + '</span>' : '') + '</button>' +
    '<span class="slip-amt">' + (d.amount ? esc((d.type === 'income' ? '+' : '') + money(d.amount)) : '<span class="slip-need">amount?</span>') + '</span></div>';
}
function renderSlips() {
  const box = $('#slips');
  const r = UI.draft;
  const text = $('#entry').value.trim();
  let h = '';
  if (r && text && r.kind === 'command') {
    const c = r.command;
    h = '<div class="slip"><span class="slip-cat">' + ic('target') + 'Budget</span><span class="slip-main"><span class="slip-note">' +
      (c.cat ? 'Set the ' + esc(catById(c.cat).name) + ' budget' : c.unknown ? 'No category called “' + esc(c.unknown) + '”' : 'Set your monthly budget') + '</span></span><span class="slip-amt">' + esc(money(c.amount)) + '</span></div>' +
      '<p class="slip-hint"><span>Press <b>Enter</b> to set it</span></p>';
  } else if (r && text && r.kind === 'entries' && r.entries.length) {
    const ds = r.entries.map((d, i) => (UI.slipOver[i] ? Object.assign({}, d, UI.slipOver[i]) : d));
    h = ds.slice(0, 4).map(slipHTML).join('');
    if (ds.length > 4) h += '<p class="slip-hint">and ' + (ds.length - 4) + ' more</p>';
    const missing = ds.some(d => !d.amount);
    const aiHelp = aiReady() && r.needsAI;
    h += '<p class="slip-hint">' + (UI.busy ? '<span>Claude is reading it…</span>' : missing && !aiHelp ? '<span>Add an amount, like <b>' + esc(exampleTry()[0]) + '</b></span>'
      : '<span>Press <b>Enter</b> to save' + (ds.length > 1 ? ' all ' + ds.length : '') + '</span>' + (aiHelp ? '<span>Claude will double-check this one</span>' : '<span>Tap the category to change it</span>')) + '</p>';
  }
  if (box.innerHTML !== h) box.innerHTML = h;
  box.hidden = !h;
  updateDockHeight();
}
function nudge(msg) {
  const c = $('#coach');
  c.innerHTML = ic('info') + '<span>' + esc(msg) + '</span>';
  c.hidden = false;
  updateDockHeight();
  clearTimeout(nudge.t);
  nudge.t = setTimeout(hideCoach, 6000);
}
function hideCoach() { const c = $('#coach'); if (c && !c.hidden) { c.hidden = true; updateDockHeight(); } }

async function submitEntry(source) {
  const el = $('#entry');
  const text = el.value.trim();
  if (!text || UI.busy) return;
  clearTimeout(parseTimer);
  const r = parseText(text, parseCtx());
  UI.draft = r;
  if (r.kind === 'command') return runCommand(r.command);
  let drafts = r.entries.map((d, i) => (UI.slipOver[i] ? Object.assign({}, d, UI.slipOver[i]) : d));
  if (aiReady() && (r.needsAI || drafts.some(d => !d.amount))) {
    UI.busy = true;
    renderSlips();
    UI.aiCtl = new AbortController();
    try {
      const ai = await aiParseText(text, UI.aiCtl.signal);
      if (ai.length) {
        ai.forEach((a, i) => {
          const o = ai.length === drafts.length ? UI.slipOver[i] : null;
          if (o && o.cat) { a.cat = o.cat; a.type = catById(o.cat).type; a.catLocked = true; }
          if (ai.length === drafts.length) a.tags = drafts[i].tags || [];
        });
        drafts = ai;
      }
    } catch (e) {
      aiNoteError(e);
      if (e && e.code !== 'cancelled' && !drafts.some(d => d.amount)) toast(aiErrorText(e));
    } finally {
      UI.busy = false;
      UI.aiCtl = null;
    }
  }
  drafts = drafts.filter(d => d.amount > 0);
  if (!drafts.length) { renderSlips(); nudge('I couldn’t find an amount. Try something like “' + exampleTry()[0] + '”.'); return; }
  if (el.value.trim() === text) { el.value = ''; UI.draft = null; UI.slipOver = {}; autosize(); syncDockButtons(); }
  renderSlips();
  const src = source || (r.source === 'sms' ? 'sms' : 'text');
  await saveDrafts(drafts.map(d => Object.assign({}, d, { source: src })), src);
}
async function runCommand(cmd) {
  if (cmd.kind !== 'budget') return;
  if (!cmd.cat && cmd.unknown) { nudge('There is no category called “' + cmd.unknown + '”. Try one like food, groceries or shopping.'); return; }
  const b = budgets();
  const nb = { total: b.total, cats: Object.assign({}, b.cats), sample: false };
  if (cmd.cat) nb.cats[cmd.cat] = cmd.amount; else nb.total = cmd.amount;
  try { await saveBudgets(nb); } catch (e) { toast(storeErrorText(e)); return; }
  $('#entry').value = ''; UI.draft = null; autosize(); syncDockButtons(); renderSlips();
  toast((cmd.cat ? catById(cmd.cat).name + ' budget' : 'Monthly budget') + ' set to ' + money(cmd.amount) + ' a month', [{ label: 'View', run: () => setTab('budgets') }]);
}

/* ---------- voice ---------- */
const Voice = { on: false, rec: null, failed: false, supported: typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition) };
function setMicUI(on) {
  const b = $('#mic-btn');
  b.classList.toggle('listening', on);
  b.innerHTML = on ? ICON.stop : ICON.mic;
  b.setAttribute('aria-label', on ? 'Stop listening' : 'Speak an entry');
  syncDockButtons();
}
function dictationCoach() {
  const el = $('#entry');
  el.focus();
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const mac = /Mac/i.test(navigator.platform || navigator.userAgent || '');
  const msg = coarse ? 'Tap the microphone on your keyboard and say it, like “lunch 250 at Subway”.'
    : mac ? 'Press the Globe key or Fn twice to dictate, then say something like “lunch 250 at Subway”.'
      : 'Press Windows + H to dictate, then say something like “lunch 250 at Subway”.';
  const c = $('#coach');
  c.innerHTML = ic('mic') + '<span>' + esc(msg) + '</span>';
  c.hidden = false;
  updateDockHeight();
  clearTimeout(nudge.t);
  nudge.t = setTimeout(hideCoach, 9000);
}
function toggleVoice() {
  if (Voice.on) { try { Voice.rec.stop(); } catch (e) { /* ignore */ } return; }
  if (!Voice.supported || Voice.failed) { dictationCoach(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec;
  try { rec = new SR(); } catch (e) { Voice.failed = true; dictationCoach(); return; }
  rec.lang = FMT.cur === 'INR' ? 'en-IN' : (navigator.language || 'en-US');
  rec.interimResults = true;
  rec.continuous = false;
  let finalText = '', heard = false;
  const el = $('#entry');
  const before = el.value.trim();
  rec.onresult = ev => {
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) { const r = ev.results[i]; if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript; }
    heard = true;
    el.value = (before ? before + ' ' : '') + (finalText + ' ' + interim).trim();
    onEntryInput();
  };
  rec.onerror = ev => {
    if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed' || ev.error === 'audio-capture') { Voice.failed = true; dictationCoach(); }
    else if (ev.error === 'no-speech') nudge('I didn’t hear anything. Tap the mic and try again.');
  };
  rec.onend = () => {
    Voice.on = false; Voice.rec = null; setMicUI(false);
    if (heard && finalText.trim()) { onEntryInput(); if (settings().voiceAuto) setTimeout(() => submitEntry('voice'), 120); }
  };
  try { rec.start(); Voice.on = true; Voice.rec = rec; setMicUI(true); hideCoach(); }
  catch (e) { Voice.failed = true; dictationCoach(); }
}
