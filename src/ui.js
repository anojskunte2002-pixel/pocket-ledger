/* ===================== interface: chrome, views, capture ===================== */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const SVG = p => '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>';
const ICON = {
  mic: SVG('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  stop: SVG('<rect x="7" y="7" width="10" height="10" rx="2"/>'),
  plus: SVG('<path d="M12 5v14M5 12h14"/>'),
  send: SVG('<path d="M12 19V5M5 12l7-7 7 7"/>'),
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
  calendar: SVG('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/>'),
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
  upload: SVG('<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>'),
  home: SVG('<path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>'),
  list: SVG('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  plan: SVG('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M9 15.5l2 2 4-4"/>'),
  chart: SVG('<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>'),
  people: SVG('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.6a5 5 0 0 1 6 4.4"/>'),
  palette: SVG('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 22 9.8C22 6 17.5 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>'),
  clock: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  bell: SVG('<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>'),
  sliders: SVG('<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>')
};
const ic = name => '<span class="ic" aria-hidden="true">' + (ICON[name] || ICON.info) + '</span>';
/* Inside Claude the page gets shared cloud storage and Claude; as a plain website it keeps data in this browser. */
const IN_CLAUDE = typeof window !== 'undefined' && !!(window.claude && typeof window.claude.use === 'function');
function uiFlag(k, v) { try { if (v === undefined) return localStorage.getItem(LS_PREFIX + 'ui:' + k) === '1'; localStorage.setItem(LS_PREFIX + 'ui:' + k, v ? '1' : '0'); } catch (e) { /* optional */ } return false; }
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
function ordinal(n) { const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'); return n + s; }

const UI = {
  tab: 'home', person: 'all', period: '', periodTouched: false,
  act: { q: '', type: 'all', cat: '' }, actLimit: 300,
  draft: null, slipOver: {}, busy: false, aiCtl: null, capOpen: false,
  undo: null, flash: new Set(), flashTimer: 0,
  ask: { turns: [], busy: false, ctl: null, live: '', err: '' },
  review: { busy: false, text: '', err: '', ctl: null, key: '' },
  tables: {}, mounted: '', insSig: '', downloads: null, permissions: null,
  counted: new Map(), ringsDone: false
};

/* ---------- render loop ---------- */
let renderQ = 0;
function render() { if (renderQ) return; renderQ = requestAnimationFrame(() => { renderQ = 0; renderNow(); }); }
function currentKey() { return periodKeyFor(todayStr(), settings().startDay); }
function renderNow() {
  const st = settings();
  if (FMT.cur !== st.currency) setCurrency(st.currency);
  if (!UI.period || (!UI.periodTouched && UI.period !== currentKey())) UI.period = currentKey();
  if (household().solo && UI.person !== 'all') UI.person = 'all';
  renderHeader();
  renderBanner();
  renderView();
  renderSlips();
  syncDockButtons();
}
function periodShortLabel(p) {
  return settings().startDay === 1 ? fmtDate(p.start, { month: 'short', year: 'numeric' }) : shortDate(p.start) + '–' + shortDate(p.end);
}
function avatarHTML(id, size) {
  const cls = 'av ' + (id === 'p2' ? 'p2' : id === 'joint' ? 'joint' : 'p1') + (size ? ' ' + size : '');
  return '<span class="' + cls + '" aria-hidden="true">' + (id === 'joint' ? '<i></i><i></i>' : esc(initials(memberName(id)))) + '</span>';
}
function renderHeader() {
  const h = household(), sd = settings().startDay, p = periodFromKey(UI.period, sd), cur = currentKey();
  const av = $('#avatars');
  const avH = h.solo ? avatarHTML('p1') : avatarHTML('p1') + avatarHTML('p2');
  if (av.innerHTML !== avH) av.innerHTML = avH;
  $('#hh-title').textContent = h.setup ? h.members.map(m => m.name).join(' & ') : 'Pocket Ledger';
  $('#hh-sub').textContent = h.setup ? (h.solo ? 'Pocket Ledger' : 'Household') : 'Your money, one line at a time';
  const lab = $('#period-label');
  const labH = '<span class="pl-long">' + esc(periodLabel(p)) + '</span><span class="pl-short">' + esc(periodShortLabel(p)) + '</span>';
  if (lab.innerHTML !== labH) lab.innerHTML = labH;
  lab.setAttribute('aria-label', UI.period === cur ? 'Showing ' + periodLabel(p) : 'Showing ' + periodLabel(p) + '. Go back to this ' + cycleWord());
  $('#next-period').disabled = UI.period >= cur;
  const ppl = $('#people');
  ppl.hidden = h.solo;
  if (!h.solo) {
    const opts = [['all', 'Overall'], ['p1', h.members[0].name], ['p2', h.members[1].name], ['joint', 'Shared']];
    const sig = opts.map(o => o[1]).join('|');
    if (ppl.dataset.sig !== sig) {
      ppl.innerHTML = '<span class="seg-thumb" aria-hidden="true"></span>' + opts.map(o => '<button type="button" role="radio" data-act="person" data-arg="' + o[0] + '">' + (o[0] === 'all' ? '' : avatarHTML(o[0], 'xs')) + '<span>' + esc(o[1]) + '</span></button>').join('');
      ppl.dataset.sig = sig;
    }
    const idx = Math.max(0, opts.findIndex(o => o[0] === UI.person));
    ppl.style.setProperty('--i', idx);
    for (const b of $$('button', ppl)) b.setAttribute('aria-checked', String(b.dataset.arg === UI.person));
  }
  for (const b of $$('.lbar [data-tab]')) { const on = b.dataset.tab === UI.tab; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  const tabs = $('#lbar .tabs');
  if (tabs) tabs.style.setProperty('--ti', Math.max(0, ['home', 'activity', 'plan', 'insights'].indexOf(UI.tab)));
}
function bannerHTML(icon, text, tone, extra) {
  return '<div class="banner glass' + (tone ? ' tone-' + tone : '') + '">' + ic(icon) + '<span>' + text + '</span>' + (extra || '') + '</div>';
}
let SAMPLE_CACHE = { v: -1, has: false };
function hasSamples() {
  if (SAMPLE_CACHE.v !== Store.version) { let h = false; for (const e of Store.entries.values()) if (e.sample) { h = true; break; } SAMPLE_CACHE = { v: Store.version, has: h }; }
  return SAMPLE_CACHE.has || getPlan().sample;
}
function renderBanner() {
  let h = '';
  if (Store.ready) {
    if (Store.mode === 'device' && !IN_CLAUDE) { if (!uiFlag('device-note')) h += bannerHTML('device', 'Your entries stay private in this browser, on this device. Download a backup from Settings now and then.', '', '<button class="link" type="button" data-act="hide-device-note">Got it</button>'); }
    else if (Store.mode === 'device') h += bannerHTML('device', Store.reason === 'no-access' ? 'This ledger is private to its household. You have your own copy here, saved on this device only.' : 'Entries are saved on this device only. Open this page in Claude while signed in to keep them in your account.');
    else if (Store.mode === 'memory') h += bannerHTML('alert', 'This browser is blocking storage, so entries disappear when you close the page. Export a backup before you leave.', 'warn');
    if (Store.error) h += bannerHTML('alert', esc(Store.error), 'warn');
    if (hasSamples()) h += bannerHTML('sparkle', 'You are looking at example data. Your own entries stay when you clear it.', 'info', '<button class="link" type="button" data-act="clear-examples">Clear examples</button>');
  }
  const el = $('#banner');
  if (el.innerHTML !== h) el.innerHTML = h;
}
function enterMotion(v) {
  if (reducedMotion()) return;
  v.classList.remove('enter');
  void v.offsetWidth;
  v.classList.add('enter');
  clearTimeout(enterMotion.t);
  enterMotion.t = setTimeout(() => v.classList.remove('enter'), 900);
}
function renderView() {
  const v = $('#view');
  if (!Store.ready) return;
  const tab = UI.tab, fresh = UI.mounted !== tab;
  if (tab === 'activity') {
    if (UI.mounted !== 'activity') { v.innerHTML = activityShell(); UI.mounted = 'activity'; bindActivity(); }
    updateActivity();
  } else if (tab === 'insights') {
    const sig = aiReady() + '|' + AI.blocked + '|' + AI.tools;
    if (UI.mounted !== 'insights' || UI.insSig !== sig) { v.innerHTML = insightsShell(); UI.mounted = 'insights'; UI.insSig = sig; bindInsights(); }
    updateInsights();
  } else {
    v.innerHTML = tab === 'plan' ? planHTML() : homeHTML();
    UI.mounted = tab;
    if (fresh) window.scrollTo(0, 0);
    afterRender();
  }
  if (fresh) enterMotion(v);
  refractNow();
}
function afterRender() {
  for (const el of $$('#view .chart[data-chart="flow"]')) flowChart(el, analyze(UI.period, el.dataset.view || 'all'));
  animateRings();
  runCountUps();
}
function setTab(t) {
  if (['home', 'activity', 'plan', 'insights'].indexOf(t) < 0) t = 'home';
  const change = UI.tab !== t;
  const go = () => {
    UI.tab = t;
    if (location.hash !== '#' + t) { try { history.replaceState(null, '', '#' + t); } catch (e) { location.hash = t; } }
    hideTip();
    if (change) window.scrollTo(0, 0);
    renderNow();
  };
  go();
}
function setPerson(p) {
  if (['all', 'p1', 'p2', 'joint'].indexOf(p) < 0 || household().solo) p = 'all';
  if (UI.person === p) return;
  UI.person = p;
  render();
}
function shiftPeriod(n) {
  const next = shiftKey(UI.period, n);
  if (next > currentKey()) return;
  UI.period = next; UI.periodTouched = next !== currentKey();
  render();
}

/* ---------- motion: numbers that count, rings that fill ---------- */
function runCountUps() {
  for (const el of $$('[data-count]')) {
    const to = +el.dataset.count, key = el.dataset.key || 'n';
    const had = UI.counted.has(key), from = had ? UI.counted.get(key) : to;
    UI.counted.set(key, to);
    if (!had || from === to || reducedMotion()) continue;
    const sign = el.dataset.sign || '';
    const t0 = performance.now(), D = 700;
    const step = now => {
      const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      el.textContent = sign + moneyR(from + (to - from) * e);
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
function animateRings() {
  const rings = $$('#view .ring-val');
  if (!rings.length || UI.ringsDone || reducedMotion()) { UI.ringsDone = UI.ringsDone || rings.length > 0; return; }
  UI.ringsDone = true;
  for (const r of rings) { r.style.transition = 'none'; r.setAttribute('stroke-dashoffset', r.dataset.c); }
  requestAnimationFrame(() => requestAnimationFrame(() => { for (const r of rings) { r.style.transition = ''; r.setAttribute('stroke-dashoffset', r.dataset.off); } }));
}

/* ---------- rows ---------- */
/* who paid and who it was for, in a few words */
function peopleText(e) {
  if (household().solo) return '';
  const w = whoOf(e);
  if (e.cat === 'settle') return memberName(payerOf(e)) + ' paid ' + memberName(w) + ' back';
  if (e.type === 'income') return w === 'joint' ? 'Shared income' : memberName(w);
  const pay = payerOf(e);
  if (w === 'joint') return memberName(pay) + ' paid · shared';
  if (w === pay) return memberName(w);
  return memberName(pay) + ' paid for ' + memberName(w);
}
function rowHTML(e) {
  const c = catById(e.cat, e.type), k = kindOf(e), solo = household().solo, w = whoOf(e);
  const full = e.full != null ? e.full : e.amount;
  const view = UI.person === 'p1' || UI.person === 'p2' ? UI.person : '';
  const part = e.part != null ? e.part : (view && !solo ? shareOf(e, view, shareRatio()) : 1);
  const metaBits = [c.name];
  if (!solo) metaBits.push(peopleText(e));
  if (e.merchant && e.note.toLowerCase().indexOf(e.merchant.toLowerCase()) < 0) metaBits.push(e.merchant);
  if (e.method) metaBits.push(e.method);
  if (e.rec || e.plan) metaBits.push('planned');
  if (e.tags.length) metaBits.push('#' + e.tags.join(' #'));
  const by = !solo && e.by && e.by !== payerOf(e) && e.type !== 'income' ? '<span class="by">added by ' + esc(memberName(e.by)) + '</span>' : '';
  const amt = e.type === 'income' ? money(full, { sign: true }) : money(full);
  const sub = view && part > 0 && part < 1 ? '<small>' + esc(memberName(view)) + '’s share ' + esc(moneyR(full * part)) + '</small>' : k === 'transfer' ? '<small>' + (e.cat === 'settle' ? 'settling up' : 'not spending') + '</small>' : k === 'invest' ? '<small>saved</small>' : '';
  return '<button type="button" class="row ' + e.type + ' k-' + k + (UI.flash.has(e.id) ? ' flash' : '') + '" data-act="edit" data-arg="' + esc(e.id) + '">' +
    '<span class="badge" aria-hidden="true">' + esc(c.emoji) + (solo ? '' : '<span class="who-dot ' + w + '"></span>') + '</span>' +
    '<span class="row-main"><span class="row-title">' + esc(e.note) + '</span><span class="row-meta">' + esc(metaBits.join(' · ')) + by + '</span></span>' +
    '<span class="row-amt">' + amt + sub + '</span></button>';
}
function dayGroupsHTML(list, totals) {
  let h = '', day = '';
  const tot = {};
  if (totals) for (const e of list) { const t = tot[e.date] || (tot[e.date] = { s: 0, i: 0 }); if (kindOf(e) === 'spend') t.s += e.amount; else if (e.type === 'income') t.i += e.amount; }
  for (const e of list) {
    if (e.date !== day) {
      if (day) h += '</div></div>';
      day = e.date;
      let t = '';
      if (totals) { const x = tot[day], bits = []; if (x.s) bits.push(money(x.s) + ' spent'); if (x.i) bits.push(money(x.i, { sign: true })); t = '<span class="tot">' + esc(bits.join(' · ')) + '</span>'; }
      h += '<div class="day"><div class="day-h"><span>' + esc(dayLabel(day)) + '</span>' + t + '</div><div class="glass list">';
    }
    h += rowHTML(e);
  }
  if (day) h += '</div></div>';
  return h;
}
function flashIds(ids) {
  for (const id of ids) UI.flash.add(id);
  clearTimeout(UI.flashTimer);
  UI.flashTimer = setTimeout(() => { UI.flash.clear(); }, 2200);
}

/* ---------- home ---------- */
function greetHTML(A) {
  const hr = new Date().getHours();
  const part = hr < 5 ? 'Good night' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : hr < 22 ? 'Good evening' : 'Good night';
  const h = household();
  const name = h.setup ? memberName(meId()) : '';
  let sub;
  if (A.isCurrent) sub = fmtDate(todayStr(), { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + (A.daysLeft === 0 ? 'last day of the ' + cycleWord() : plural(A.daysLeft, 'day') + ' left this ' + cycleWord());
  else sub = 'Looking back at ' + periodLabel(A.p);
  if (UI.person !== 'all') sub = 'Showing ' + (UI.person === 'joint' ? 'shared money' : memberName(UI.person) + '’s side: own spending plus their share') + ' · ' + sub;
  return '<section class="greet"><h1>' + part + (name ? ', <em>' + esc(name) + '</em>' : '') + '</h1><p>' + esc(sub) + '</p></section>';
}
function welcomeHTML() {
  const tries = exampleTry();
  const ways = [
    ['keyboard', 'Type it', 'Like a text: “uber 230 yesterday on card”', 'focus-entry'],
    ['mic', 'Say it', 'Tap the mic and talk', 'voice'],
    ['camera', 'Snap a receipt', 'Photos and payment screenshots', 'scan'],
    ['message', 'Paste bank messages', 'SMS or e-mail alerts, many at once', 'import-sms'],
    ['file', 'Import a statement', 'CSV from your bank or card', 'import-csv'],
    ['plan', 'Plan the month', 'Income, fixed costs and a saving goal', 'tab-plan']
  ].filter(w => w[3] !== 'scan' || (aiReady() && AI.images));
  const h = household();
  return '<section class="welcome">' +
    '<p class="eyebrow">Your money, one line at a time</p>' +
    '<h1>Track money by <em>just saying it.</em></h1>' +
    '<p class="lede">Type or speak the way you would text someone. Pocket Ledger finds the amount, the date, how you paid' + (h.solo ? '' : ', whose it was') + ' and the right category, then turns it all into a plan you can trust.</p>' +
    (h.setup ? '' : '<div class="welcome-cta"><button type="button" class="btn primary" data-act="household">' + ic('people') + 'Set up your household</button><span class="muted">One person or two. Takes ten seconds.</span></div>') +
    '<div class="try"><span class="lbl-s">Tap one to try it</span><div class="try-row">' + tries.map(t => '<button type="button" class="try-chip glass" data-act="try" data-arg="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div></div>' +
    '<ul class="ways">' + ways.map(w => '<li><button type="button" class="way glass" data-act="' + w[3] + '">' + ic(w[0]) + '<b>' + w[1] + '</b><span>' + w[2] + '</span></button></li>').join('') + '</ul>' +
    '<div class="welcome-cta"><button type="button" class="btn" data-act="examples">' + ic('sparkle') + 'Explore with example data</button><span class="muted">Clearly marked, and gone with one tap.</span></div>' +
    '</section>';
}
function homeHTML() {
  if (!Store.entries.size && !getPlan().exists) return welcomeHTML();
  const A = analyze(UI.period, UI.person), two = !household().solo;
  let h = greetHTML(A);
  // the plan's safe-to-spend needs planned income; until then show what was actually spent
  const planned = A.plan && A.plan.expectedIncome > 0;
  if (UI.person === 'joint') h += sharedHeroHTML(A);
  else if (UI.person !== 'all') h += (planned ? planHeroHTML(A) : personHeroHTML(A)) + storyHTML(A);
  else h += planned ? planHeroHTML(A) : spendHeroHTML(A);
  if (UI.person === 'all' && two) h += pairHTML(A);
  if (UI.person !== 'joint' && A.plan && A.plan.fixed.length) h += billsStripHTML(A);
  h += topInsightsHTML(A) + recentHTML(A);
  return h;
}
function ringsSVG(rings, label) {
  let s = '<svg class="rings" viewBox="0 0 140 140" role="img" aria-label="' + esc(label) + '">';
  rings.forEach((r, i) => {
    const rad = 70 - 7 - i * 17, c = 2 * Math.PI * rad, v = clamp(r.v || 0, 0, 1), off = c * (1 - v);
    s += '<circle class="ring-track" cx="70" cy="70" r="' + rad + '" style="stroke:' + r.color + '"/>';
    s += '<circle class="ring-val" cx="70" cy="70" r="' + rad + '" stroke-dasharray="' + f1(c) + '" stroke-dashoffset="' + f1(off) + '" data-c="' + f1(c) + '" data-off="' + f1(off) + '" transform="rotate(-90 70 70)" style="stroke:' + (r.over ? 'var(--bad)' : r.color) + '"/>';
  });
  return s + '</svg>';
}
function planHeroHTML(A) {
  const P = A.plan, left = P.flexLeft, daysIncl = A.isCurrent ? A.daysLeft + 1 : 0;
  let tone = 'good', chip = 'On plan';
  if (left < 0) { tone = 'bad'; chip = 'Over plan'; }
  else if (A.isCurrent && A.dayIndex >= 3 && A.everydayProjected > P.flexible * 1.02) { tone = 'warn'; chip = 'Spending fast'; }
  if (!A.isCurrent) chip = left >= 0 ? 'Closed under plan' : 'Closed over plan';
  const label = A.isCurrent ? (left >= 0 ? 'Safe to spend' : 'Over your everyday plan') : (left >= 0 ? 'Left unspent' : 'Over plan');
  const sub = A.isCurrent
    ? (left >= 0 ? (daysIncl > 1 ? 'About ' + moneyR(left / daysIncl) + ' a day · ' + plural(daysIncl, 'day') + ' to go' : 'Last day of the ' + cycleWord() + ', and all of it is still yours') : 'Everyday spending is ' + moneyR(-left) + ' past plan')
    : 'Everyday plan ' + money(P.flexible) + ', spent ' + moneyR(P.everydaySpent);
  const rings = [
    { v: P.flexible > 0 ? P.everydaySpent / P.flexible : (P.everydaySpent > 0 ? 1 : 0), color: 'var(--ring1)', over: P.everydaySpent > P.flexible },
    { v: P.fixedTotal > 0 ? P.fixedPaid / P.fixedTotal : 0, color: 'var(--ring2)' },
    { v: P.expectedIncome > 0 ? P.incomeActual / P.expectedIncome : (P.incomeActual > 0 ? 1 : 0), color: 'var(--ring3)' }
  ];
  const legend = [
    ['ring1', 'Everyday', compact(P.everydaySpent) + ' of ' + compact(Math.max(0, P.flexible))],
    ['ring2', 'Bills paid', P.doneCount + ' of ' + P.fixed.length + (P.fixedLeft > 0 ? ' · ' + compact(P.fixedLeft) + ' due' : '')],
    ['ring3', 'Income in', compact(P.incomeActual) + ' of ' + compact(P.expectedIncome)]
  ];
  return '<section class="glass hero refract">' +
    '<div class="hero-top"><span class="eyebrow">' + esc(label) + '</span><span class="chip tone-' + tone + '">' + ic(tone === 'good' ? 'check' : 'alert') + chip + '</span></div>' +
    '<div class="hero-main"><div class="hero-figure"><div class="hero-num" data-count="' + Math.round(Math.abs(left)) + '" data-key="hero">' + esc(moneyR(Math.abs(left))) + '</div><p class="hero-sub">' + esc(sub) + '</p></div>' +
    ringsSVG(rings, 'Everyday ' + pct(rings[0].v) + ' used, bills ' + pct(rings[1].v) + ' paid, income ' + pct(rings[2].v) + ' received') + '</div>' +
    '<ul class="legend-rows">' + legend.map(l => '<li><i style="--k:var(--' + l[0] + ')"></i><span>' + l[1] + '</span><b>' + esc(l[2]) + '</b></li>').join('') + '</ul>' +
    '</section>';
}
function spendHeroHTML(A) {
  const b = A.budgetTotal;
  let chip = '', meter = '', sub = '';
  if (b) {
    const left = b - A.spend;
    let tone = 'good', label = A.isCurrent ? 'On track' : 'Under budget';
    if (left < 0) { tone = 'bad'; label = 'Over budget'; }
    else if (A.isCurrent && A.dayIndex >= 3 && A.projection > b * 1.02) { tone = 'warn'; label = 'Spending fast'; }
    chip = '<span class="chip tone-' + tone + '">' + ic(tone === 'good' ? 'check' : 'alert') + label + '</span>';
    meter = '<div class="meter tone-' + tone + '" role="meter" aria-label="Budget used" aria-valuemin="0" aria-valuemax="' + Math.round(b) + '" aria-valuenow="' + Math.round(A.spend) + '"><span style="width:' + Math.min(100, A.spend / b * 100).toFixed(1) + '%"></span>' + (A.isCurrent ? '<i class="pace" style="left:' + (A.dayIndex / A.p.days * 100).toFixed(1) + '%" title="Even pace for today"></i>' : '') + '</div>';
    sub = left >= 0 ? esc(money(left)) + ' left of ' + esc(money(b)) + (A.isCurrent ? ' · about ' + esc(moneyR(left / (A.daysLeft + 1))) + ' a day' : '') : esc(money(-left)) + ' over your ' + esc(money(b)) + ' budget';
  } else sub = getPlan().fixed.length ? 'Add each income to the plan to see what is safe to spend.' : 'Add your income and fixed costs to see what is safe to spend.';
  return '<section class="glass hero refract"><div class="hero-top"><span class="eyebrow">Spent ' + (A.isCurrent ? 'this ' + cycleWord() : 'in ' + esc(periodLabel(A.p))) + '</span>' + chip + '</div>' +
    '<div class="hero-num" data-count="' + Math.round(A.spend) + '" data-key="hero">' + esc(moneyR(A.spend)) + '</div>' + meter +
    '<p class="hero-sub">' + sub + '</p><dl class="hero-stats"><div><dt>Income</dt><dd>' + esc(moneyR(A.income)) + '</dd></div><div><dt>Saved</dt><dd>' + (A.income > 0 ? esc(moneyR(A.saved)) + ' <small>' + pct(A.savingsRate) + '</small>' : '–') + '</dd></div><div><dt>' + (A.isCurrent && A.dayIndex >= 3 ? 'Projected' : 'Per day') + '</dt><dd>' + esc(A.isCurrent && A.dayIndex >= 3 ? money(niceRound(A.projection)) : moneyR(A.avgPerDay)) + '</dd></div></dl>' +
    (!getPlan().exists ? '<div class="hero-cta"><button type="button" class="btn primary" data-act="tab" data-arg="plan">' + ic('plan') + 'Plan your ' + cycleWord() + '</button></div>'
      : !getPlan().incomes.length ? '<div class="hero-cta"><button type="button" class="btn primary" data-act="plan-new" data-arg="income">' + ic('plus') + 'Add income to the plan</button></div>' : '') + '</section>';
}
function personHeroHTML(A) {
  const who = UI.person, name = memberName(who);
  return '<section class="glass hero refract"><div class="hero-top"><span class="eyebrow">' + esc(name) + ' spent' + (A.isCurrent ? ' this cycle' : '') + '</span>' + avatarHTML(who) + '</div>' +
    '<div class="hero-num" data-count="' + Math.round(A.spend) + '" data-key="hero">' + esc(moneyR(A.spend)) + '</div>' +
    '<p class="hero-sub">Own spending plus their share of shared costs' + (A.prevToDate > 0 && A.isCurrent ? ' · ' + esc(deltaText(A.spend, A.prevToDate, true, 'the same day last cycle').text) : '') + '</p>' +
    '<dl class="hero-stats"><div><dt>Earned</dt><dd>' + esc(moneyR(A.income)) + '</dd></div><div><dt>Invested</dt><dd>' + esc(moneyR(A.invest)) + '</dd></div><div><dt>Per day</dt><dd>' + esc(moneyR(A.avgPerDay)) + '</dd></div></dl>' +
    (getPlan().incomes.some(x => x.who === who) ? '' : '<div class="hero-cta"><button type="button" class="btn primary" data-act="plan-quick" data-arg="income:salary:Salary:' + who + '">' + ic('plus') + 'Add ' + esc(name) + '’s salary to the plan</button></div>') + '</section>';
}
/* one person's money, as a short story: earned, minus own spending, minus their share of shared costs, equals saved */
function storyHTML(A) {
  const w = A.person, nm = memberName(w), part = w === 'p1' ? A.ratio : 1 - A.ratio;
  const saved = A.income - A.spend;
  return '<section class="glass card story"><p class="eyebrow">' + esc(nm) + '’s money ' + (A.isCurrent ? 'this cycle' : 'in ' + esc(periodLabel(A.p))) + '</p>' +
    '<div class="st-row"><span>Earned</span><b>' + esc(money(Math.round(A.income))) + '</b></div>' +
    '<div class="st-row"><span>Own spending<small>EMIs, family, personal</small></span><b>− ' + esc(money(Math.round(A.own))) + '</b></div>' +
    '<div class="st-row"><span>Share of shared costs<small>' + pct(part) + ' of ' + esc(money(Math.round(A.sharedTotal))) + '</small></span><b>− ' + esc(money(Math.round(A.shareSpend))) + '</b></div>' +
    '<div class="st-row total"><span>' + (saved >= 0 ? 'Saved' : 'Spent more than earned') + '<small>' + (saved >= 0 ? 'investments count as saved' : A.income > 0 ? 'income logged so far this ' + cycleWord() : 'no income logged yet this ' + cycleWord()) + '</small></span><b class="' + (saved >= 0 ? 'in' : 'neg') + '">' + esc(money(Math.round(Math.abs(saved)))) + (A.income > 0 && saved >= 0 ? ' <small>' + pct(saved / A.income) + '</small>' : '') + '</b></div>' +
    '<p class="st-foot">' + esc(money(Math.round(A.paidOut))) + ' left ' + esc(nm) + '’s pocket, counting shared costs they paid for both of you.</p>' + settleLine(w) + '</section>';
}
function sharedHeroHTML(A) {
  const pb = A.paidBy || { p1: 0, p2: 0 }, r = A.ratio;
  return '<section class="glass hero refract"><div class="hero-top"><span class="eyebrow">Shared spending' + (A.isCurrent ? ' this cycle' : '') + '</span>' + avatarHTML('joint') + '</div>' +
    '<div class="hero-num" data-count="' + Math.round(A.spend) + '" data-key="hero">' + esc(moneyR(A.spend)) + '</div>' +
    '<p class="hero-sub">Split ' + splitLabel() + ': ' + esc(memberName('p1')) + ' ' + esc(moneyR(A.spend * r)) + ' · ' + esc(memberName('p2')) + ' ' + esc(moneyR(A.spend * (1 - r))) + '</p>' +
    paidBarHTML(pb.p1, pb.p2) + settleLine('joint') + '</section>';
}
function paidBarHTML(a, b) {
  if (a + b <= 0) return '';
  return '<div class="paid-bar" role="img" aria-label="' + esc('Paid: ' + memberName('p1') + ' ' + money(a) + ', ' + memberName('p2') + ' ' + money(b)) + '"><i class="p1" style="flex:' + a.toFixed(2) + '"></i><i class="p2" style="flex:' + b.toFixed(2) + '"></i></div>' +
    '<div class="paid-legend"><span><i class="p1"></i>' + esc(memberName('p1')) + ' paid ' + esc(moneyR(a)) + '</span><span><i class="p2"></i>' + esc(memberName('p2')) + ' paid ' + esc(moneyR(b)) + '</span></div>';
}
/* the single number that keeps a shared life fair: who owes whom, across everything logged */
function settleLine(view) {
  const b = balanceNow();
  if (!b) return '';
  if (!b.amount) return '<div class="settle ok">' + ic('check') + '<span class="st-txt">All square between you two</span></div>';
  return '<div class="settle">' + avatarHTML(b.from, 'xs') + '<span class="st-txt">' + esc(memberName(b.from)) + ' owes ' + esc(memberName(b.to)) + ' <b>' + esc(moneyR(b.amount)) + '</b></span><button type="button" class="btn mini primary" data-act="settle">Settle up</button></div>';
}
function pairHTML(A) {
  const P = A.people;
  if (!P || !P.p1) return '';
  const card = w => {
    const x = P[w], tot = Math.max(x.earned, x.spent, 1);
    const tone = x.rate == null ? '' : x.rate >= 0.2 ? 'good' : x.rate >= 0 ? 'warn' : 'bad';
    return '<button type="button" class="glass pcard" data-act="person" data-arg="' + w + '">' +
      '<span class="pc-top">' + avatarHTML(w) + '<b>' + esc(memberName(w)) + '</b></span>' +
      '<span class="pc-rows"><span><small>Earned</small><b>' + esc(compact(x.earned)) + '</b></span><span><small>Spent</small><b>' + esc(compact(x.spent)) + '</b></span><span><small>' + (x.saved < 0 ? 'Overspent' : 'Saved') + '</small><b class="' + (x.saved < 0 ? 'neg' : 'in') + '">' + esc(compact(Math.abs(x.saved))) + '</b></span>' +
      (x.rate != null ? '<span class="pc-rate tone-' + tone + '">' + (x.rate >= 0 ? pct(x.rate) + ' of income kept' : 'spent more than earned') + '</span>' : '') + '</span>' +
      '<span class="pc-bar" aria-hidden="true"><i class="own" style="width:' + (x.own / tot * 100).toFixed(1) + '%"></i><i class="sh" style="width:' + (x.shared / tot * 100).toFixed(1) + '%"></i><i class="sv" style="width:' + (Math.max(0, x.saved) / tot * 100).toFixed(1) + '%"></i></span>' +
      '<span class="pc-legend"><span><i class="own"></i>Own ' + esc(compact(x.own)) + '</span><span><i class="sh"></i>Shared ' + esc(compact(x.shared)) + '</span></span></button>';
  };
  return '<section class="sec"><div class="sec-head"><h2 class="sec-h">You two</h2><span class="sec-sum">Shared costs split ' + splitLabel() + '</span></div>' +
    '<div class="pair">' + card('p1') + card('p2') + '</div>' +
    '<div class="glass shared-card"><button type="button" class="sc-head" data-act="person" data-arg="joint">' + avatarHTML('joint') + '<span><b>Shared ' + esc(moneyR(A.sharedSpend)) + '</b><small>' + (A.sharedSpend ? 'rent, groceries, outings and anything else for both of you' : 'Nothing shared yet in this cycle') + '</small></span></button>' +
    paidBarHTML(P.p1.paidShared, P.p2.paidShared) + settleLine('all') + '</div></section>';
}

const STATE_LABEL = { done: ['check', 'Paid'], partial: ['clock', 'Part paid'], late: ['alert', 'Late'], soon: ['bell', 'Due soon'], upcoming: ['calendar', 'Due'] };
function billsStripHTML(A) {
  const P = A.plan, solo = household().solo, rank = { late: 0, soon: 1, partial: 2, upcoming: 3, done: 4 };
  const rows = P.fixed.slice().sort((a, b) => rank[a.state] - rank[b.state] || (a.due < b.due ? -1 : 1));
  return '<section class="sec"><div class="sec-head"><h2 class="sec-h">Bills this cycle</h2><span class="sec-sum">' + P.doneCount + ' of ' + P.fixed.length + ' paid</span></div><div class="strip">' + rows.map(r => {
    const mine = r.mine != null && r.part < 1;
    return '<button type="button" class="glass bill st-' + r.state + '" data-act="plan-item" data-arg="' + esc(r.id) + '">' + ic(STATE_LABEL[r.state][0]) +
      '<span class="b-name">' + esc(r.name) + '</span><span class="b-amt">' + esc(moneyR(mine ? r.mine : r.amount)) + '</span>' +
      '<span class="b-due">' + esc((r.state === 'done' ? 'Paid' : r.state === 'late' ? 'Late since ' + shortDate(r.due) : r.state === 'partial' ? moneyR(r.paid) + ' paid' : 'Due ' + (r.due === A.today ? 'today' : shortDate(r.due))) + (mine ? ' · share of ' + compact(r.amount) : solo ? '' : ' · ' + (r.who === 'joint' ? 'shared' : memberName(r.who)))) + '</span></button>';
  }).join('') + '</div></section>';
}
function insightItemHTML(x) {
  const toneWord = { good: 'Good', warn: 'Heads up', bad: 'Alert', info: '' }[x.tone] || '';
  return '<li class="ins glass tone-' + x.tone + '"><span class="ins-ic" aria-hidden="true">' + (ICON[x.icon] || ICON.info) + '</span>' +
    '<p class="ins-t">' + (toneWord ? '<span class="tone-tag">' + toneWord + '</span>' : '') + esc(x.title) + '</p><p class="ins-b">' + esc(x.body) + '</p>' +
    (x.action ? '<button type="button" class="link" data-act="' + esc(x.action.act) + '" data-arg="' + esc(x.action.arg) + '">' + esc(x.action.label) + '</button>' : '') + '</li>';
}
function topInsightsHTML(A) {
  const list = A.insights.slice(0, 4);
  if (!list.length) return '';
  return '<section class="sec"><div class="sec-head"><h2 class="sec-h">What stands out</h2>' + (A.insights.length > 4 ? '<button type="button" class="link" data-act="tab" data-arg="insights">All insights</button>' : '') + '</div><ul class="ins-row">' + list.map(insightItemHTML).join('') + '</ul></section>';
}
function recentHTML(A) {
  const r = shareRatio();
  const mine = e => (UI.person === 'all' ? true : UI.person === 'joint' ? whoOf(e) === 'joint' : shareOf(e, UI.person, r) > 0);
  const base = A.isCurrent ? sortedEntries().filter(mine) : A.entries;
  const list = base.slice(0, 8);
  const body = list.length ? dayGroupsHTML(list, false) : '<div class="empty glass"><h3>Nothing logged in ' + esc(periodLabel(A.p)) + '</h3><p>Entries you add for these dates show up here.</p></div>';
  return '<section class="sec"><div class="sec-head"><h2 class="sec-h">' + (A.isCurrent ? 'Latest entries' : 'Entries') + '</h2><button type="button" class="link" data-act="tab" data-arg="activity">See all</button></div>' + body + '</section>';
}

/* ---------- plan ---------- */
function planSetupHTML(A) {
  const quick = [['income', 'salary', 'Salary'], ['fixed', 'home', 'Rent'], ['fixed', 'emi', 'EMI'], ['fixed', 'sendhome', 'Sending home'], ['fixed', 'insurance', 'Insurance']];
  return '<section class="greet"><h1>Plan your <em>month</em></h1><p>Tell the app what comes in and what is already spoken for. It works out what is safe to spend, every day.</p></section>' +
    '<section class="glass card setup"><ol class="steps">' +
    '<li><b>Money in.</b> Salaries, freelance work, rent you receive, interest.</li>' +
    '<li><b>Fixed costs.</b> Rent, EMIs, sending home, insurance, SIPs.</li>' +
    '<li><b>Saving goal.</b> What you want to keep every month.</li></ol>' +
    '<div class="try-row">' + quick.map(q => '<button type="button" class="chip-btn" data-act="plan-quick" data-arg="' + q[0] + ':' + q[1] + ':' + esc(q[2]) + '">' + ic('plus') + esc(q[2]) + '</button>').join('') + '<button type="button" class="chip-btn" data-act="plan-goal">' + ic('plus') + 'Saving goal</button></div>' +
    '<div class="welcome-cta">' + (A.total ? '<button type="button" class="btn primary" data-act="plan-suggest">' + ic('sparkle') + 'Fill it in from our entries</button>' : '<button type="button" class="btn primary" data-act="plan-new" data-arg="income">' + ic('plus') + 'Add income</button>') + '</div></section>';
}
function eqItem(label, v, key) { return '<div class="eq-item' + (key ? ' ' + key : '') + '"><span>' + label + '</span><b>' + esc(compact(v)) + '</b></div>'; }
function planRowHTML(r, today) {
  const c = catById(r.cat, r.kind === 'income' ? 'income' : 'expense'), solo = household().solo;
  const doneWord = r.kind === 'income' ? 'Received' : 'Paid';
  const mine = r.mine != null && r.part < 1, amount = mine ? r.mine : r.amount;
  const st = { done: doneWord, partial: moneyR(r.paid) + ' of ' + moneyR(r.amount), late: (r.kind === 'income' ? 'Expected ' : 'Late · due ') + shortDate(r.due), soon: 'Due ' + (r.due === today ? 'today' : shortDate(r.due)), upcoming: 'Due ' + shortDate(r.due) }[r.state];
  const whoTxt = solo ? '' : (r.who === 'joint' ? (mine ? 'Shared · ' + pct(r.part) + ' of ' + compact(r.amount) : 'Shared · split ' + splitLabel()) : memberName(r.who)) + ' · ';
  return '<div class="pl-row st-' + r.state + '">' + avatarHTML(r.who) +
    '<button type="button" class="pl-main" data-act="plan-edit" data-arg="' + esc(r.id) + '"><span class="pl-name"><span aria-hidden="true">' + esc(c.emoji) + '</span> ' + esc(r.name) + '</span>' +
    '<span class="pl-meta">' + esc(whoTxt + ordinal(r.day) + (r.auto ? ' · logs itself' : '')) + '</span></button>' +
    '<span class="pl-right"><b>' + esc(moneyR(amount)) + '</b><span class="pl-st">' + ic(STATE_LABEL[r.state][0]) + esc(st) + '</span></span>' +
    (r.state === 'done' ? '<span class="pl-done" aria-hidden="true">' + ICON.check + '</span>' : '<button type="button" class="mini-btn" data-act="' + (r.who === 'joint' && !solo ? 'plan-item' : 'plan-pay') + '" data-arg="' + esc(r.id) + '">' + doneWord + '</button>') + '</div>';
}
function planListHTML(title, rows, kind, A) {
  const P = A.plan;
  const sumTxt = kind === 'income' ? compact(P.incomeActual) + ' of ' + compact(P.expectedIncome) + ' in' : compact(P.fixedPaid) + ' of ' + compact(P.fixedTotal) + ' paid';
  return '<section class="sec"><div class="sec-head"><h2 class="sec-h">' + title + '</h2><span class="sec-sum">' + esc(sumTxt) + '</span></div><div class="glass list">' +
    rows.map(r => planRowHTML(r, A.today)).join('') +
    '<button type="button" class="pl-add" data-act="plan-new" data-arg="' + kind + '">' + ic('plus') + (kind === 'income' ? 'Add income' : 'Add a fixed cost') + '</button></div></section>';
}
function envelopesHTML(A) {
  const b = budgets(), P = A.plan, ids = Object.keys(b.cats);
  const assigned = sum(ids.map(id => b.cats[id]));
  let h = '<section class="sec"><div class="sec-head"><h2 class="sec-h">Everyday budgets</h2>' + (A.priorCount || A.count > 10 ? '<button type="button" class="link" data-act="budget-suggest">Suggest</button>' : '') + '</div><div class="glass list">';
  if (P && P.flexible > 0) h += '<p class="env-note">' + esc(compact(assigned) + ' of your ' + compact(P.flexible) + ' everyday money is set aside for categories' + (P.flexible - assigned > 0 ? ' · ' + compact(P.flexible - assigned) + ' free' : '')) + '</p>';
  for (const id of ids.sort((x, y) => b.cats[y] - b.cats[x])) {
    const c = catById(id), lim = b.cats[id], v = A.byCat.get(id), spent = v ? v.total : 0, left = lim - spent;
    const tone = left < 0 ? 'bad' : (A.isCurrent && spent / lim > A.dayIndex / A.p.days + 0.15 && spent / lim >= 0.6 ? 'warn' : 'good');
    h += '<button type="button" class="bud-row" data-act="budget-edit" data-arg="' + esc(id) + '"><span class="badge" aria-hidden="true">' + esc(c.emoji) + '</span><span class="t">' + esc(c.name) + '</span><span class="v">' + esc(moneyR(spent)) + ' <span class="muted">/ ' + esc(moneyR(lim)) + '</span></span>' +
      '<span class="meter sm tone-' + tone + '" aria-hidden="true"><span style="width:' + Math.min(100, spent / lim * 100).toFixed(1) + '%"></span>' + (A.isCurrent ? '<i class="pace" style="left:' + (A.dayIndex / A.p.days * 100).toFixed(1) + '%"></i>' : '') + '</span>' +
      '<span class="m">' + (left >= 0 ? esc(moneyR(left)) + ' left' : esc(moneyR(-left)) + ' over') + (tone === 'warn' ? ' · ahead of pace' : '') + '</span></button>';
  }
  if (!ids.length) h += '<p class="env-note">Give categories like eating out or shopping a monthly limit, and the app warns you before you go over.</p>';
  h += '<button type="button" class="pl-add" data-act="budget-add">' + ic('plus') + 'Add a category budget</button></div></section>';
  return h;
}
function goalRowHTML(w, goal, A) {
  const solo = household().solo, proj = Math.max(0, A.projectedSave || 0), prog = goal ? proj / goal : 0, tone = prog >= 1 ? 'good' : prog >= 0.75 ? 'warn' : 'bad';
  return '<button type="button" class="goal-row" data-act="plan-goal">' + (solo ? '' : avatarHTML(w)) + '<span class="gr-main"><span class="gr-top"><b>' + (solo ? 'Each month' : esc(memberName(w))) + '</b><span>' + (goal ? esc(money(goal)) : 'No goal yet') + '</span></span>' +
    (goal ? '<span class="meter sm tone-' + tone + '"><span style="width:' + Math.min(100, prog * 100).toFixed(1) + '%"></span></span><small>' + (A.isCurrent ? 'On course to keep ' : 'Kept ') + esc(moneyR(proj)) + (prog >= 1 ? ', goal covered' : '') + '</small>' : '<small>Set what ' + (solo ? 'you want' : esc(memberName(w)) + ' wants') + ' to keep each cycle</small>') + '</span></button>';
}
function planHTML() {
  const view = UI.person === 'p1' || UI.person === 'p2' ? UI.person : 'all';
  const all = analyze(UI.period, 'all');
  if (!getPlan().exists) return planSetupHTML(all) + envelopesHTML(all);
  const A = analyze(UI.period, view), P = A.plan, person = view !== 'all', nm = person ? memberName(view) : '';
  let h = '<section class="greet"><h1>' + (person ? esc(nm) + '’s <em>plan</em>' : A.isCurrent ? 'This cycle’s <em>plan</em>' : '<em>Plan</em> for ' + esc(periodLabel(A.p))) + '</h1><p>' +
    (person ? 'Their income, their own fixed costs, their share of the shared ones and what they keep. The rest is theirs to spend.' : 'What comes in, what is fixed and what you keep. The rest is safe to spend.') + '</p></section>';
  h += '<section class="glass eq refract">' + eqItem(person ? 'Earns' : 'Coming in', P.expectedIncome || P.incomeActual) + '<span class="op">−</span>' + eqItem('Fixed', P.fixedTotal) + '<span class="op">−</span>' + eqItem('Saving', P.save) + '<span class="op">=</span>' + eqItem('Everyday', P.flexible, 'res' + (P.flexible < 0 ? ' neg' : '')) + '</section>';
  if (P.flexible < 0) h += '<p class="note-box">Planned costs and saving are ' + esc(money(-P.flexible)) + ' more than ' + (person ? esc(nm) + ' earns' : 'the money coming in') + '. Lower a fixed cost or the saving goal, or add income.</p>';
  h += '<section class="glass cc"><div class="cc-head"><div><h3>Where the money goes</h3><p class="cc-sub">' + (person ? 'Shared costs at ' + esc(nm) + '’s share' : 'Each income on the left, every planned use on the right') + '</p></div></div><div class="chart" data-chart="flow" data-view="' + view + '"></div></section>';
  h += planListHTML('Money in', P.incomes, 'income', A);
  h += planListHTML('Fixed costs', P.fixed, 'fixed', A);
  const solo = household().solo, g = getPlan().saveBy;
  h += '<section class="sec"><div class="sec-head"><h2 class="sec-h">Saving ' + (solo || person ? 'goal' : 'goals') + '</h2><button type="button" class="link" data-act="plan-goal">' + (P.save ? 'Change' : 'Set') + '</button></div><div class="glass list goals">';
  if (solo) h += goalRowHTML('p1', g.p1, A);
  else for (const w of person ? [view] : ['p1', 'p2']) h += goalRowHTML(w, g[w], person ? A : analyze(UI.period, w));
  h += '</div></section>';
  return h + (person ? '' : envelopesHTML(A));
}

/* ---------- activity ---------- */
function activityShell() {
  const types = [['all', 'All'], ['expense', 'Spending'], ['income', 'Income']];
  return '<section class="act"><div class="filters">' +
    '<label class="search glass">' + ic('search') + '<span class="sr">Search entries</span><input id="act-q" type="search" placeholder="Search notes, places, #tags or amounts" autocomplete="off" enterkeyhint="search"></label>' +
    '<div class="filter-row"><div class="chips" role="group" aria-label="Show">' + types.map(t => '<button type="button" class="chip-btn" data-act="act-type" data-arg="' + t[0] + '" aria-pressed="false">' + t[1] + '</button>').join('') + '</div>' +
    '<select id="act-cat" class="select glass" aria-label="Category"></select></div></div>' +
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
  const hay = (e.note + ' ' + e.merchant + ' ' + e.method + ' ' + catById(e.cat, e.type).name + ' ' + memberName(whoOf(e)) + ' ' + memberName(payerOf(e)) + ' ' + e.tags.map(t => '#' + t).join(' ')).toLowerCase();
  return q.split(/\s+/).every(w => hay.indexOf(w) >= 0);
}
function activityList() {
  const q = UI.act.q.trim().toLowerCase();
  let list = sortedEntries();
  if (!q) { const p = periodFromKey(UI.period, settings().startDay); list = list.filter(e => e.date >= p.start && e.date <= p.end); }
  if (UI.person === 'joint') list = list.filter(e => whoOf(e) === 'joint');
  else if (UI.person !== 'all') { const r = shareRatio(); list = list.filter(e => shareOf(e, UI.person, r) > 0 || payerOf(e) === UI.person); }
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
  const view = UI.person === 'p1' || UI.person === 'p2' ? UI.person : '', r = shareRatio();
  const amt = e => (view ? e.amount * shareOf(e, view, r) : e.amount);
  const spent = sum(list.filter(e => kindOf(e) === 'spend'), amt), inc = sum(list.filter(e => e.type === 'income'), amt);
  const p = periodFromKey(UI.period, settings().startDay);
  const who = UI.person === 'all' ? '' : ' · ' + (UI.person === 'joint' ? 'shared' : memberName(UI.person));
  $('#act-sum').innerHTML = list.length ? '<span>' + plural(list.length, 'entry', 'entries') + (UI.act.q.trim() ? ' · all dates' : ' · ' + esc(periodLabel(p))) + esc(who) + '</span><span>' + (view ? esc(memberName(view)) + '’s share <b>' : 'Spent <b>') + esc(money(Math.round(spent))) + '</b>' + (inc ? ' · Income <b class="in">' + esc(money(Math.round(inc))) + '</b>' : '') + '</span>' : '';
  const shown = list.slice(0, UI.actLimit);
  let h;
  if (!list.length) {
    h = UI.act.q.trim() || UI.act.cat || UI.act.type !== 'all' || UI.person !== 'all'
      ? '<div class="empty glass"><h3>No entries match</h3><p>Try fewer words, or clear the filters.</p><button type="button" class="btn" data-act="act-clear">Clear filters</button></div>'
      : '<div class="empty glass"><h3>Nothing logged in ' + esc(periodLabel(p)) + '</h3><p>Add one below, like <b>' + esc(exampleTry()[0]) + '</b>.</p></div>';
  } else {
    h = dayGroupsHTML(shown, true);
    if (list.length > shown.length) h += '<button type="button" class="btn more" data-act="act-more">Show ' + Math.min(300, list.length - shown.length) + ' more</button>';
    else h += '<div class="grand glass"><span>Total spent</span><span class="v">' + esc(money(spent)) + '</span></div>';
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
  return '<div id="ins-kpis"></div><section class="glass ask" id="ask"><div class="ask-head"><h2 class="sec-h">' + ic('spark') + 'Ask about your money</h2>' + (intro ? '' : '<button type="button" class="link" data-act="review">Month in review</button>') + '</div>' + ask + '</section><div id="ins-body"></div>';
}
function bindInsights() {
  const f = $('#ask-form');
  if (f) f.addEventListener('submit', ev => { ev.preventDefault(); const q = $('#ask-q'); const v = q.value; q.value = ''; askSubmit(v); });
}
function kpiHTML(label, value, delta) {
  return '<div class="glass kpi"><div class="kpi-l">' + label + '</div><div class="kpi-v">' + value + '</div>' + (delta ? '<div class="kpi-d ' + (delta.tone || '') + '">' + delta.text + '</div>' : '<div class="kpi-d">&nbsp;</div>') + '</div>';
}
function deltaText(now, then, upIsBad, versus) {
  if (!(then > 0)) return { text: '' };
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
  return '<section class="glass cc"><div class="cc-head"><div><h3>' + title + '</h3>' + (sub ? '<p class="cc-sub">' + sub + '</p>' : '') + '</div>' +
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
    const c = catById(id), avg = A.avgCat.get(id) || 0, expected = A.isCurrent ? avg * (A.dayIndex / A.p.days) : avg;
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
function whoBarsHTML(A) {
  const rows = Array.from(A.catWho.entries()).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  if (!rows.length) return '<p class="muted">No spending yet in this period.</p>';
  const max = rows[0][1].total;
  return '<div class="sbars">' + rows.map(([id, v]) => {
    const c = catById(id);
    const parts = ['p1', 'p2', 'joint'].filter(w => v[w] > 0);
    return '<div class="sbar"><div class="sbar-head"><span><span aria-hidden="true">' + esc(c.emoji) + '</span> ' + esc(c.name) + '</span><b>' + esc(money(v.total)) + '</b></div>' +
      '<div class="sbar-track" style="width:' + Math.max(4, v.total / max * 100).toFixed(1) + '%" role="img" aria-label="' + esc(parts.map(w => memberName(w) + ' ' + money(v[w])).join(', ')) + '">' + parts.map(w => '<i class="' + w + '" style="flex:' + v[w].toFixed(2) + '"></i>').join('') + '</div>' +
      '<div class="sbar-sub">' + esc(parts.map(w => memberName(w) + ' ' + compact(v[w])).join(' · ')) + '</div></div>';
  }).join('') + '</div>';
}
function compareHTML(A) {
  const P = A.people, rows = [['Earned', 'earned'], ['Spent', 'spent'], ['Own spending', 'own'], ['Share of shared', 'shared'], ['Saved', 'saved']];
  const max = Math.max(1, ...['p1', 'p2'].map(w => Math.max(P[w].earned, P[w].spent)));
  return '<div class="cmp">' + rows.map(([label, k]) => '<div class="cmp-row"><span class="cmp-l">' + label + '</span>' + ['p1', 'p2'].map(w => '<span class="cmp-bar"><i class="' + w + '" style="width:' + (Math.max(0, P[w][k]) / max * 100).toFixed(1) + '%"></i><b' + (P[w][k] < 0 ? ' class="neg"' : '') + '>' + esc(compact(P[w][k])) + '</b></span>').join('') + '</div>').join('') +
    '<div class="cmp-row"><span class="cmp-l">Saving rate</span>' + ['p1', 'p2'].map(w => '<span class="cmp-bar txt"><b>' + (P[w].rate == null ? '–' : pct(P[w].rate)) + '</b></span>').join('') + '</div></div>';
}
function incomeSourcesHTML(A) {
  const rows = Array.from(A.incomeBy.entries()).sort((a, b) => b[1].total - a[1].total);
  if (!rows.length) return '<p class="muted">No income logged in this period yet. Try “salary 85000 credited”.</p>';
  const solo = household().solo;
  return '<ul class="plain">' + rows.map(([id, v]) => {
    const c = catById(id, 'income');
    const who = solo ? '' : ['p1', 'p2', 'joint'].filter(w => v[w] > 0).map(w => memberName(w) + ' ' + compact(v[w])).join(' · ');
    return '<li><span><span aria-hidden="true">' + esc(c.emoji) + '</span> ' + esc(c.name) + '</span><b>' + esc(money(v.total)) + '</b><span class="m">' + esc(pct(v.total / Math.max(1, A.income)) + ' of income' + (who ? ' · ' + who : '')) + '</span></li>';
  }).join('') + '</ul>';
}
function nwsHTML(A) {
  const inc = A.income;
  const saved = inc > 0 ? Math.max(0, inc - A.needs - A.wants) : A.invest;
  const total = inc > 0 ? Math.max(inc, A.needs + A.wants) : A.needs + A.wants + A.invest;
  if (total <= 0) return '<p class="muted">Log some spending to see the split.</p>';
  const segs = [['s1', 'Needs', A.needs, 'rent, bills, groceries, sending home'], ['s2', 'Wants', A.wants, 'eating out, shopping, fun, travel'], ['s3', inc > 0 ? 'Saved' : 'Invested', saved, inc > 0 ? 'income not spent, investments included' : 'SIPs, deposits and investments']];
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
  if (!A.subs.length) return '<p class="muted">Charges that repeat every month show up here, from repeating entries or ones spotted in your history.</p>';
  const every = { weekly: 'every week', monthly: 'every month', yearly: 'every year' };
  return '<ul class="plain">' + A.subs.slice(0, 10).map(s => '<li><span>' + esc(s.name) + '</span><b>' + esc(moneyR(s.monthly)) + '<span class="muted"> /mo</span></b><span class="m">' + esc(money(s.amount) + ' ' + every[s.every] + (s.next ? ' · next ' + shortDate(s.next) : '') + (s.rule ? '' : ' · spotted in history')) + '</span></li>').join('') +
    '<li><span><b>Total</b></span><b>' + esc(moneyR(sum(A.subs, s => s.monthly))) + '<span class="muted"> /mo</span></b><span class="m">' + esc(moneyR(sum(A.subs, s => s.monthly) * 12)) + ' a year</span></li></ul>';
}
function updateInsights() {
  const A = analyze(UI.period, UI.person);
  $('#ins-kpis').innerHTML = Store.entries.size ? kpisHTML(A) : '';
  renderAsk();
  const body = $('#ins-body');
  if (!Store.entries.size) {
    body.innerHTML = '<div class="empty glass"><h3>Insights appear as you log</h3><p>Add a few entries, or explore with example data to see what this page can tell you.</p><button type="button" class="btn" data-act="examples">' + ic('sparkle') + 'Explore with example data</button></div>';
    return;
  }
  const pl = esc(periodLabel(A.p)), solo = household().solo;
  let h = '';
  if (A.insights.length) h += '<section class="sec"><h2 class="sec-h">What stands out</h2><ul class="ins-list">' + A.insights.map(insightItemHTML).join('') + '</ul></section>';
  if (UI.person === 'all' && !solo && A.people && A.people.p1) {
    h += '<section class="sec"><h2 class="sec-h">You two</h2>';
    h += chartCard('compare', esc(memberName('p1')) + ' and ' + esc(memberName('p2')), 'This cycle side by side. Spent counts own spending plus each share of shared costs.', keyRect('var(--p1)', esc(memberName('p1'))) + keyRect('var(--p2)', esc(memberName('p2'))), compareHTML(A), '');
    h += chartCard('who', 'Who spends on what', 'Each bar splits a category into each person’s own spending and what you share', keyRect('var(--p1)', esc(memberName('p1')) + '’s own') + keyRect('var(--p2)', esc(memberName('p2')) + '’s own') + keyRect('var(--pj)', 'Shared'), whoBarsHTML(A), '');
    h += '</section>';
  }
  h += '<section class="sec"><h2 class="sec-h">Where the money went</h2>';
  h += chartCard('pace', 'Running total', A.isCurrent ? 'Spending so far this ' + cycleWord() + ' against the last one' + (A.budgetTotal ? ' and your budget' : '') : 'How spending built up through ' + pl,
    keyLine('var(--s1)', 'This month') + (A.isCurrent && A.dayIndex < A.p.days ? keyLine('var(--s1)', 'Projected', true) : '') + keyLine('var(--muted-line)', 'Last month') + (A.budgetTotal ? keyLine('var(--budget-line)', 'Budget') : ''),
    '<div class="chart" data-chart="pace"></div>', paceTable(A));
  h += chartCard('cats', 'By category', 'Tap a category to see its entries' + (A.priorCount ? '. Arrows compare with your usual pace.' : '.'), '', categoryBarsHTML(A), '');
  h += chartCard('trend', 'Month by month', 'Spending and income for up to six months', keyRect('var(--s1)', 'Spent') + keyRect('var(--s3)', 'Income'), '<div class="chart" data-chart="trend"></div>', trendTable(A));
  h += chartCard('income', 'Income sources', 'Salary, freelance, rent received, interest and more', '', incomeSourcesHTML(A), '');
  h += '</section><section class="sec"><h2 class="sec-h">Habits</h2><div class="grid2">';
  h += chartCard('heat', 'Day by day', 'Brighter days cost more', '', heatmapHTML(A), '');
  h += chartCard('weekday', 'Weekday rhythm', 'Average day-to-day spend over the last 13 weeks, without fixed costs', '', '<div class="chart" data-chart="weekday"></div>', weekdayTable(A));
  h += chartCard('nws', 'Needs, wants and saving', inA(A), '', nwsHTML(A), '');
  h += chartCard('methods', 'How you paid', 'Spending and investing by payment method', '', methodsHTML(A), '');
  h += chartCard('places', 'Top places', 'Where the most went', '', placesHTML(A), '');
  h += chartCard('subs', 'Repeating charges', 'Subscriptions and bills, as a monthly cost', '', subsHTML(A), '');
  h += '</div></section>';
  body.innerHTML = h;
  drawCharts(A);
}
function inA(A) { return A.income > 0 ? 'Share of income ' + (A.isCurrent ? 'this ' + cycleWord() : 'in ' + esc(periodLabel(A.p))) : 'Share of outflow, since no income is logged'; }
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
  const h = household();
  const two = !h.solo ? ['Who spent more on eating out this month, ' + h.members[0].name + ' or ' + h.members[1].name + '?'] : [];
  return ['Where did most of our money go this month?'].concat(two, ['Are we on track with our plan?', 'Where can we cut back without much pain?', 'Can we afford a ' + money(exAmount(20000, 1200)) + ' trip next month?']);
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
  if (sg) sg.innerHTML = UI.ask.turns.length ? (!UI.ask.busy ? '<button type="button" class="chip-btn" data-act="ask-clear">Start over</button>' : '') : askSuggestions().map(s => '<button type="button" class="chip-btn" data-act="ask-sugg" data-arg="' + esc(s) + '">' + esc(s) + '</button>').join('');
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
  const A = analyze(UI.period, UI.person);
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
  const A = analyze(UI.period, UI.person);
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

/* ---------- toast ---------- */
let toastTimer = 0;
function toast(msg, actions, ms) {
  if (!msg) return;
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = 'toast glass';
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

/* ---------- capture: the liquid bar, live preview of what will be saved ---------- */
let parseTimer = 0;
function autosize() { const t = $('#entry'); t.style.height = 'auto'; t.style.height = Math.min(136, t.scrollHeight) + 'px'; updateDockHeight(); }
function updateDockHeight() { const d = $('#dock'); if (d) document.documentElement.style.setProperty('--dock-h', d.offsetHeight + 'px'); refractNow(); }
function setCapOpen(open) {
  if (UI.capOpen === open) return;
  UI.capOpen = open;
  $('#lbar').classList.toggle('open', open);
  $('#entry').placeholder = open ? 'Try “' + exampleTry()[0] + '”' : 'Add';
  setTimeout(updateDockHeight, 480);
}
function maybeCloseCap() {
  const el = $('#entry');
  if (!el.value.trim() && !Voice.on && !UI.busy && document.activeElement !== el) setCapOpen(false);
}
function syncDockButtons() {
  const has = $('#entry').value.trim().length > 0;
  $('#send-btn').hidden = !has || Voice.on;
  $('#mic-btn').hidden = has && !Voice.on;
  if (has || Voice.on) setCapOpen(true);
}
function onEntryInput() {
  autosize();
  syncDockButtons();
  hideCoach();
  UI.slipOver = {};
  clearTimeout(parseTimer);
  parseTimer = setTimeout(() => { UI.draft = parseText($('#entry').value, parseCtx()); renderSlips(); }, 80);
}
function draftWho(d) { return entryPeople(d).who; }
function personChip(act, i, w, label) { return '<button type="button" class="slip-who" data-act="' + act + '" data-arg="' + i + '" aria-label="' + esc(label) + '. Change">' + avatarHTML(w, 'xs') + esc(label) + '</button>'; }
function slipHTML(d, i) {
  const c = catById(d.cat, d.type), k = kindOf(d), solo = household().solo;
  const meta = [];
  if (d.date !== todayStr()) meta.push(dayLabel(d.date));
  if (d.method) meta.push(d.method);
  if (d.repeat) meta.push('repeats ' + d.repeat);
  if (d.tags && d.tags.length) meta.push('#' + d.tags.join(' #'));
  if (k === 'invest') meta.push('counts as saving');
  if (k === 'transfer') meta.push('not counted as spending');
  const pp = entryPeople(d);
  if (!solo && pp.who === 'joint' && d.type !== 'income') meta.push('split ' + splitLabel());
  const people = solo ? '' : d.type === 'income' ? personChip('slip-for', i, pp.who, pp.who === 'joint' ? 'Shared income' : memberName(pp.who) + '’s income')
    : personChip('slip-paid', i, pp.paid, memberName(pp.paid) + ' paid') + personChip('slip-for', i, pp.who, pp.who === 'joint' ? 'for both' : 'for ' + memberName(pp.who));
  return '<div class="slip glass ' + d.type + (UI.busy ? ' busy' : '') + '"><div class="slip-chips">' +
    '<button type="button" class="slip-cat" data-act="slip-cat" data-arg="' + i + '" aria-label="Category ' + esc(c.name) + '. Change category"><span aria-hidden="true">' + esc(c.emoji) + '</span>' + esc(c.name) + '</button>' + people + '</div>' +
    '<span class="slip-amt">' + (d.amount ? esc((d.type === 'income' ? '+' : '') + money(d.amount)) : '<span class="slip-need">amount?</span>') + '</span>' +
    '<button type="button" class="slip-main" data-act="slip-edit" data-arg="' + i + '" aria-label="Edit before saving"><span class="slip-note">' + esc(d.note) + '</span>' + (meta.length ? '<span class="slip-meta">' + meta.map(m => '<span>' + esc(m) + '</span>').join('') + '</span>' : '') + '</button></div>';
}
function renderSlips() {
  const box = $('#slips');
  const r = UI.draft;
  const text = $('#entry').value.trim();
  let h = '';
  if (r && text && r.kind === 'command') {
    const c = r.command;
    h = '<div class="slip glass"><div class="slip-chips"><span class="slip-cat">' + ic('target') + 'Budget</span></div><span class="slip-amt">' + esc(money(c.amount)) + '</span><span class="slip-main"><span class="slip-note">' +
      (c.cat ? 'Set the ' + esc(catById(c.cat).name) + ' budget' : c.unknown ? 'No category called “' + esc(c.unknown) + '”' : 'Set your monthly budget') + '</span></span></div>' +
      '<p class="slip-hint"><span>Press <b>Enter</b> to set it</span></p>';
  } else if (r && text && r.kind === 'entries' && r.entries.length) {
    const ds = r.entries.map((d, i) => (UI.slipOver[i] ? Object.assign({}, d, UI.slipOver[i]) : d));
    h = ds.slice(0, 4).map(slipHTML).join('');
    if (ds.length > 4) h += '<p class="slip-hint">and ' + (ds.length - 4) + ' more</p>';
    const missing = ds.some(d => !d.amount);
    const aiHelp = aiReady() && r.needsAI;
    h += '<p class="slip-hint">' + (UI.busy ? '<span>Claude is reading it…</span>' : missing && !aiHelp ? '<span>Add an amount, like <b>' + esc(exampleTry()[0]) + '</b></span>'
      : '<span>Press <b>Enter</b> to save' + (ds.length > 1 ? ' all ' + ds.length : '') + '</span>' + (aiHelp ? '<span>Claude will double-check this one</span>' : '<span>Tap a chip to change it</span>')) + '</p>';
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
          const same = ai.length === drafts.length, o = same ? UI.slipOver[i] : null;
          if (o && o.cat) { a.cat = o.cat; a.type = catById(o.cat).type; a.catLocked = true; }
          if (same) { a.tags = drafts[i].tags || []; a.who = (o && o.who) || drafts[i].who || a.who || ''; a.paid = (o && o.paid) || drafts[i].paid || a.paid || ''; }
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
  doneTyping();
}
/* on phones, put the keyboard away after a save so the result and the tabs are in view */
function doneTyping() {
  const el = $('#entry');
  if (el.value.trim()) return;
  if (document.activeElement === el && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) el.blur();
  else if (document.activeElement !== el) setCapOpen(false);
}
async function runCommand(cmd) {
  if (cmd.kind !== 'budget') return;
  if (!cmd.cat && cmd.unknown) { nudge('There is no category called “' + cmd.unknown + '”. Try one like food, groceries or shopping.'); return; }
  const b = budgets();
  const nb = { total: b.total, cats: Object.assign({}, b.cats), sample: false };
  if (cmd.cat) nb.cats[cmd.cat] = cmd.amount; else nb.total = cmd.amount;
  try { await saveBudgets(nb); } catch (e) { toast(storeErrorText(e)); return; }
  $('#entry').value = ''; UI.draft = null; autosize(); syncDockButtons(); renderSlips();
  doneTyping();
  toast((cmd.cat ? catById(cmd.cat).name + ' budget' : 'Monthly budget') + ' set to ' + money(cmd.amount) + ' a month', [{ label: 'View', run: () => setTab('plan') }]);
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
function dictationCoach(msg) {
  setCapOpen(true);
  const el = $('#entry');
  el.focus();
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const mac = /Mac/i.test(navigator.platform || navigator.userAgent || '');
  const how = coarse ? 'tap the microphone on your keyboard and speak' : mac ? 'press the Globe key or Fn twice and speak' : 'press Windows + H and speak';
  const text = msg || (IN_CLAUDE ? 'Claude doesn’t let pages use the microphone, so ' + how + ' instead. It fills this box the same way.' : 'Voice isn’t available in this browser, so ' + how + ' instead.');
  const c = $('#coach');
  c.innerHTML = ic('mic') + '<span>' + esc(text) + '</span>';
  c.hidden = false;
  updateDockHeight();
  clearTimeout(nudge.t);
  nudge.t = setTimeout(hideCoach, 10000);
}
function toggleVoice() {
  if (Voice.on) { try { Voice.rec.stop(); } catch (e) { /* ignore */ } return; }
  if (!Voice.supported || Voice.failed) { dictationCoach(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec;
  try { rec = new SR(); } catch (e) { Voice.failed = true; dictationCoach(); return; }
  rec.lang = Voice.lang || (FMT.cur === 'INR' ? 'en-IN' : (navigator.language || 'en-US'));
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
    const er = ev.error;
    if (er === 'not-allowed' || er === 'service-not-allowed') {
      if (IN_CLAUDE) { Voice.failed = true; dictationCoach(); }
      else nudge('The microphone is blocked for this site. Allow it in your browser’s site settings, then tap the mic again.');
    } else if (er === 'audio-capture') nudge('No microphone found. Check that one is connected and not busy in another app.');
    else if (er === 'network') nudge('Voice typing needs an internet connection. Try again when you’re online.');
    else if (er === 'language-not-supported') { Voice.lang = 'en-US'; nudge('Switched voice to US English. Tap the mic again.'); }
    else if (er === 'no-speech') nudge('I didn’t hear anything. Tap the mic and try again.');
  };
  rec.onend = () => {
    Voice.on = false; Voice.rec = null; setMicUI(false);
    if (heard && finalText.trim()) { onEntryInput(); if (settings().voiceAuto) setTimeout(() => submitEntry('voice'), 120); }
    else maybeCloseCap();
  };
  try { rec.start(); Voice.on = true; Voice.rec = rec; setCapOpen(true); setMicUI(true); hideCoach(); }
  catch (e) { Voice.failed = true; dictationCoach(); }
}
