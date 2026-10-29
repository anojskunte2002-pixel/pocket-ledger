/* ===================== model accessors + analytics ===================== */
function settings() {
  const s = Store.meta.settings || {};
  return {
    currency: /^[A-Z]{3}$/.test(s.currency || '') ? s.currency : LOCALE.currency,
    startDay: clamp(parseInt(s.startDay, 10) || 1, 1, 28),
    ai: s.ai === 'off' ? 'off' : 'auto',
    voiceAuto: s.voiceAuto !== false,
    dateOrder: s.dateOrder === 'MDY' || s.dateOrder === 'DMY' ? s.dateOrder : LOCALE.dateOrder
  };
}
const GROUPS = ['needs', 'wants', 'savings', 'transfer'];
function sanitizeCat(o) {
  if (!o || typeof o !== 'object') return {};
  const r = {};
  if (typeof o.name === 'string' && o.name.trim()) r.name = o.name.trim().slice(0, 40);
  if (typeof o.emoji === 'string' && o.emoji.trim()) r.emoji = Array.from(o.emoji.trim()).slice(0, 4).join('');
  if (GROUPS.indexOf(o.group) >= 0) r.group = o.group;
  if (o.hidden) r.hidden = true;
  if (o.type === 'income' || o.type === 'expense') r.type = o.type;
  return r;
}
let CATS_CACHE = { src: undefined, list: DEFAULT_CATS, map: new Map(DEFAULT_CATS.map(c => [c.id, c])) };
function allCats() {
  const src = Store.meta.categories;
  if (CATS_CACHE.src === src) return CATS_CACHE.list;
  const over = (src && src.items) || {};
  const list = DEFAULT_CATS.map(c => {
    const o = sanitizeCat(over[c.id]);
    const r = Object.assign({}, c, o, { id: c.id, type: c.type });
    if (c.type === 'income') r.group = 'income';
    return r;
  });
  for (const id in over) {
    if (DEFAULT_CATS.some(c => c.id === id) || !over[id] || over[id].deleted) continue;
    const o = sanitizeCat(over[id]);
    if (!o.name) continue;
    const type = o.type || 'expense';
    list.push(Object.assign({ id, emoji: '🏷️', type, group: type === 'income' ? 'income' : 'wants', custom: true }, o, { type, group: type === 'income' ? 'income' : (o.group || 'wants') }));
  }
  CATS_CACHE = { src, list, map: new Map(list.map(c => [c.id, c])) };
  return list;
}
function catById(id, type) {
  allCats();
  return CATS_CACHE.map.get(id) || CATS_CACHE.map.get(type === 'income' ? 'other_in' : 'other');
}
function groupOf(e) { return e.type === 'income' ? 'income' : (catById(e.cat, e.type).group || 'wants'); }
function budgets() {
  const b = Store.meta.budgets || {};
  const cats = {};
  if (b.cats && typeof b.cats === 'object') for (const k in b.cats) if (+b.cats[k] > 0) cats[k] = +b.cats[k];
  return { total: +b.total > 0 ? +b.total : 0, cats, sample: !!b.sample };
}
function rulesMap() { return (Store.meta.rules && Store.meta.rules.map) || {}; }
function recurringItems() {
  const items = (Store.meta.recurring && Store.meta.recurring.items) || {};
  const out = {};
  for (const k in items) if (items[k] && items[k].tpl && isYMD(items[k].next)) out[k] = items[k];
  return out;
}
function parseCtx() { const s = settings(); return { today: todayStr(), dateOrder: s.dateOrder, cats: allCats(), rules: rulesMap() }; }

let SORTED = { v: -1, list: [] };
function sortedEntries() {
  if (SORTED.v !== Store.version) {
    SORTED = { v: Store.version, list: Array.from(Store.entries.values()).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.created - a.created)) };
  }
  return SORTED.list;
}

const FIXED = new Set(['home', 'emi', 'insurance', 'bills', 'subs', 'edu', 'fees']);
function kindOf(e) {
  if (e.type === 'income') return 'income';
  const g = groupOf(e);
  if (g === 'transfer') return 'transfer';
  if (g === 'savings') return 'invest';
  return 'spend';
}
function periodStats(p, list) {
  const r = { spend: 0, income: 0, invest: 0, transfer: 0, count: 0, byCat: new Map(), daily: new Array(p.days).fill(0), entries: [] };
  for (const e of list) {
    if (e.date > p.end) continue;
    if (e.date < p.start) break;
    r.count++; r.entries.push(e);
    const kind = kindOf(e);
    if (kind === 'income') r.income += e.amount;
    else if (kind === 'transfer') r.transfer += e.amount;
    else if (kind === 'invest') r.invest += e.amount;
    else { r.spend += e.amount; r.daily[daysBetween(p.start, e.date)] += e.amount; }
    const c = r.byCat.get(e.cat) || { total: 0, count: 0, kind };
    c.total += e.amount; c.count++;
    r.byCat.set(e.cat, c);
  }
  return r;
}
function running(a) { const out = []; let acc = 0; for (const v of a) { acc += v; out.push(acc); } return out; }
function isDiscretionary(e) { return kindOf(e) === 'spend' && !FIXED.has(e.cat) && !e.rec && e.source !== 'recurring'; }
function trimmedSum(amts) {
  if (amts.length < 5) return sum(amts);
  const med = median(amts), total = sum(amts);
  return sum(amts.filter(v => !(v > med * 4 && v > total * 0.25)));
}
function merchantKey(e) { return normText(e.merchant || e.note).trim(); }

let ANALYSIS = { k: '', a: null };
function analyze(key) {
  const st = settings();
  const today = todayStr();
  const meta = Store.meta;
  const ck = [Store.version, key, st.startDay, today, meta.categories && meta.categories.rev, meta.budgets && meta.budgets.rev, meta.recurring && meta.recurring.rev, FMT.cur].join('|');
  if (ANALYSIS.k === ck) return ANALYSIS.a;
  const sd = st.startDay;
  const p = periodFromKey(key, sd), pp = periodFromKey(shiftKey(key, -1), sd);
  const list = sortedEntries();
  const isCurrent = today >= p.start && today <= p.end;
  const isFuture = today < p.start;
  const dayIndex = isCurrent ? daysBetween(p.start, today) + 1 : (isFuture ? 0 : p.days);
  const daysLeft = isCurrent ? p.days - dayIndex : 0;
  const cur = periodStats(p, list), prev = periodStats(pp, list);
  const cum = running(cur.daily), prevCum = running(prev.daily);
  const prevToDate = dayIndex ? prevCum[Math.min(dayIndex, pp.days) - 1] || 0 : 0;

  const hist = [];
  for (let k = 5; k >= 0; k--) {
    const hk = shiftKey(key, -k), hp = periodFromKey(hk, sd);
    const s = k === 0 ? cur : k === 1 ? prev : periodStats(hp, list);
    hist.push({ key: hk, p: hp, spend: s.spend, income: s.income, invest: s.invest, count: s.count });
  }
  const prior = [];
  for (let k = 1; k <= 3; k++) {
    const s = k === 1 ? prev : periodStats(periodFromKey(shiftKey(key, -k), sd), list);
    if (s.spend > 0) prior.push(s);
  }
  const avgCat = new Map();
  for (const s of prior) for (const [c, v] of s.byCat) if (v.kind === 'spend') avgCat.set(c, (avgCat.get(c) || 0) + v.total / prior.length);
  const avgSpend = prior.length ? sum(prior, s => s.spend) / prior.length : 0;

  // month-end projection
  let projection = cur.spend, rate = 0, fixedLeft = 0, recurringLeft = 0;
  const rules = recurringItems();
  if (isCurrent) {
    rate = dayIndex ? trimmedSum(cur.entries.filter(isDiscretionary).map(e => e.amount)) / dayIndex : 0;
    const prevRate = trimmedSum(prev.entries.filter(isDiscretionary).map(e => e.amount)) / pp.days;
    if (dayIndex < 7 && prevRate > 0) rate = (rate * dayIndex + prevRate * (7 - dayIndex)) / 7;
    for (const c of FIXED) {
      const pv = prev.byCat.get(c), cv = cur.byCat.get(c);
      const a = pv && pv.kind === 'spend' ? pv.total : 0, b = cv && cv.kind === 'spend' ? cv.total : 0;
      if (a > b) fixedLeft += a - b;
    }
    for (const id in rules) {
      const r = rules[id];
      if (!r.active || r.tpl.type !== 'expense' || FIXED.has(r.tpl.cat)) continue;
      if (kindOf({ type: 'expense', cat: r.tpl.cat }) !== 'spend') continue;
      let n = r.next;
      while (n > today && n <= p.end) { recurringLeft += +r.tpl.amount || 0; n = nextOccurrence(n, r.every, r.day); }
    }
    projection = cur.spend + rate * daysLeft + fixedLeft + recurringLeft;
  }

  // weekday rhythm over the last 13 weeks
  const wEnd = isCurrent ? today : p.end, wStart = addDays(wEnd, -90);
  const wTot = [0, 0, 0, 0, 0, 0, 0], wCnt = [0, 0, 0, 0, 0, 0, 0];
  let firstDate = list.length ? list[list.length - 1].date : wEnd;
  const span0 = firstDate > wStart ? firstDate : wStart;
  for (let d = span0, guard = 0; d <= wEnd && guard < 400; d = addDays(d, 1), guard++) wCnt[parseYMD(d).getDay()]++;
  for (const e of list) {
    if (e.date > wEnd) continue;
    if (e.date < span0) break;
    if (isDiscretionary(e)) wTot[parseYMD(e.date).getDay()] += e.amount;
  }
  const weekday = wTot.map((t, i) => (wCnt[i] ? t / wCnt[i] : 0));
  const wkEnd = (weekday[0] + weekday[6]) / 2, wkDay = (weekday[1] + weekday[2] + weekday[3] + weekday[4] + weekday[5]) / 5;
  const weekdayDays = Math.min(...wCnt);

  // places, methods, needs / wants / saving
  const places = new Map(), methods = new Map();
  let needs = 0, wants = 0;
  for (const e of cur.entries) {
    const k = kindOf(e);
    if (k === 'spend') {
      const key2 = merchantKey(e);
      const pl = places.get(key2) || { name: e.merchant || e.note, total: 0, count: 0, cat: e.cat };
      pl.total += e.amount; pl.count++; places.set(key2, pl);
      if (groupOf(e) === 'needs') needs += e.amount; else wants += e.amount;
    }
    if (k === 'spend' || k === 'invest') { const m = e.method || 'Not recorded'; methods.set(m, (methods.get(m) || 0) + e.amount); }
  }
  const topPlaces = Array.from(places.values()).sort((a, b) => b.total - a.total).slice(0, 6);
  const methodList = Array.from(methods.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

  // unusual expense: far above the usual for its category over the last 120 days
  let unusual = null;
  const uStart = addDays(p.start, -120);
  const byCatHist = new Map();
  for (const e of list) {
    if (e.date >= p.start) continue;
    if (e.date < uStart) break;
    if (kindOf(e) !== 'spend') continue;
    if (!byCatHist.has(e.cat)) byCatHist.set(e.cat, []);
    byCatHist.get(e.cat).push(e.amount);
  }
  for (const e of cur.entries) {
    if (kindOf(e) !== 'spend' || FIXED.has(e.cat)) continue;
    const h = byCatHist.get(e.cat);
    if (!h || h.length < 4) continue;
    const med = median(h);
    const ratio = med > 0 ? e.amount / med : 0;
    if (ratio >= 3 && e.amount >= Math.max(avgSpend * 0.04, 1) && (!unusual || ratio > unusual.ratio)) unusual = { e, ratio, med };
  }

  // repeating charges
  const subs = detectRepeating(list, rules, today);

  const b = budgets();
  const A = {
    key, p, pp, today, isCurrent, isFuture, dayIndex, daysLeft,
    spend: cur.spend, income: cur.income, invest: cur.invest, transfer: cur.transfer, count: cur.count,
    byCat: cur.byCat, prevByCat: prev.byCat, avgCat, avgSpend, priorCount: prior.length,
    daily: cur.daily, cum, prevCum, prevToDate,
    prevSpend: prev.spend, prevIncome: prev.income, prevCount: prev.count,
    saved: cur.income - cur.spend, savingsRate: cur.income > 0 ? (cur.income - cur.spend) / cur.income : null,
    avgPerDay: dayIndex ? cur.spend / dayIndex : 0,
    projection, rate, fixedLeft, recurringLeft,
    hist, weekday, weekendRatio: wkDay > 0 ? wkEnd / wkDay : 0, weekdayDays,
    topPlaces, methods: methodList, needs, wants,
    unusual, subs,
    budgetTotal: b.total, budgetCats: b.cats,
    entries: cur.entries,
    noSpendDays: dayIndex ? cur.daily.slice(0, dayIndex).filter(v => v === 0).length : 0,
    biggest: cur.entries.filter(e => kindOf(e) === 'spend').sort((a, c) => c.amount - a.amount)[0] || null,
    otherCount: cur.entries.filter(e => e.cat === 'other' || e.cat === 'other_in').length,
    total: list.length, firstDate: list.length ? list[list.length - 1].date : ''
  };
  A.insights = buildInsights(A);
  ANALYSIS = { k: ck, a: A };
  return A;
}
function nextOccurrence(date, every, day) {
  if (every === 'weekly') return addDays(date, 7);
  if (every === 'yearly') return addMonths(date, 12, day);
  return addMonths(date, 1, day);
}
function monthlyEquivalent(amount, every) { return every === 'weekly' ? amount * 52 / 12 : every === 'yearly' ? amount / 12 : amount; }
function detectRepeating(list, rules, today) {
  const out = [], seen = new Set();
  for (const id in rules) {
    const r = rules[id];
    if (!r.active || r.tpl.type !== 'expense') continue;
    out.push({ name: r.tpl.note || catById(r.tpl.cat).name, cat: r.tpl.cat, monthly: monthlyEquivalent(+r.tpl.amount || 0, r.every), every: r.every, amount: +r.tpl.amount || 0, next: r.next, rule: id });
    seen.add(normText(r.tpl.merchant || r.tpl.note).trim());
  }
  const start = addDays(today, -100);
  const groups = new Map();
  for (const e of list) {
    if (e.date > today) continue;
    if (e.date < start) break;
    if (e.type !== 'expense' || e.rec || kindOf(e) === 'transfer') continue;
    const k = merchantKey(e);
    if (!k || seen.has(k)) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(e);
  }
  for (const [, g] of groups) {
    if (g.length < 2) continue;
    const months = new Set(g.map(e => monthOf(e.date)));
    if (months.size < 2 || g.length > months.size + 1) continue;
    const amts = g.map(e => e.amount), med = median(amts);
    if (!amts.every(v => Math.abs(v - med) <= med * 0.15)) continue;
    const dates = g.map(e => e.date).sort();
    let ok = true;
    for (let i = 1; i < dates.length; i++) { const gap = daysBetween(dates[i - 1], dates[i]); if (gap < 24 || gap > 37) ok = false; }
    if (!ok) continue;
    out.push({ name: g[0].merchant || g[0].note, cat: g[0].cat, monthly: med, every: 'monthly', amount: med, next: addMonths(dates[dates.length - 1], 1), rule: '' });
  }
  return out.sort((a, b) => b.monthly - a.monthly);
}

/* ---------- plain-language insights ---------- */
function buildInsights(A) {
  const out = [];
  const add = (score, tone, icon, title, body, action) => out.push({ score, tone, icon, title, body, action });
  const mon = A.isCurrent ? 'this month' : 'in ' + periodLabel(A.p);
  if (!A.count && !A.total) return out;
  if (A.budgetTotal) {
    const left = A.budgetTotal - A.spend;
    if (left < 0) add(100, 'bad', 'alert', 'Over budget by ' + money(-left), 'You have spent ' + money(A.spend) + ' of your ' + money(A.budgetTotal) + ' budget ' + mon + '.');
    else if (A.isCurrent && A.dayIndex >= 3 && A.projection > A.budgetTotal * 1.02) add(90, 'warn', 'trend', 'Heading ' + moneyR(A.projection - A.budgetTotal) + ' over budget', 'At your current pace this month ends near ' + money(niceRound(A.projection)) + '. Keeping to ' + moneyR(Math.max(0, left / Math.max(1, A.daysLeft + 1))) + ' a day gets you back under.');
    else if (A.isCurrent && A.dayIndex >= 3) add(50, 'good', 'check', 'On track for your budget', 'Projected ' + money(niceRound(A.projection)) + ' by month end, ' + moneyR(A.budgetTotal - A.projection) + ' under. You can spend about ' + moneyR(left / Math.max(1, A.daysLeft + 1)) + ' a day.');
  } else if (A.priorCount >= 1 && A.avgSpend > 0) {
    add(42, 'info', 'target', 'Set a monthly budget', 'You usually spend about ' + money(niceRound(A.avgSpend)) + ' a month. A budget near that turns on pace alerts.', { act: 'tab', arg: 'budgets', label: 'Set budget' });
  }
  for (const id in A.budgetCats) {
    const lim = A.budgetCats[id], c = A.byCat.get(id), spent = c ? c.total : 0, cat = catById(id);
    if (!cat) continue;
    if (spent > lim) add(95, 'bad', 'alert', cat.name + ' is over budget', money(spent) + ' spent of ' + money(lim) + ' ' + mon + '.');
    else if (A.isCurrent && spent >= lim * 0.8) add(80, 'warn', 'gauge', cat.name + ': ' + pct(spent / lim) + ' of budget used', money(lim - spent) + ' left with ' + A.daysLeft + (A.daysLeft === 1 ? ' day' : ' days') + ' to go.');
  }
  if (A.isCurrent && A.dayIndex >= 3 && A.prevToDate > 0) {
    const diff = (A.spend - A.prevToDate) / A.prevToDate;
    if (Math.abs(diff) >= 0.1) {
      const up = diff > 0;
      add(68 + Math.min(20, Math.abs(diff) * 40), up ? 'warn' : 'good', up ? 'up' : 'down', 'Spending is ' + pct(Math.abs(diff)) + (up ? ' higher' : ' lower') + ' than last month', money(A.spend) + ' so far, against ' + money(A.prevToDate) + ' by the same day last month.');
    }
  }
  if (A.priorCount >= 2) {
    let best = null;
    for (const [id, avg] of A.avgCat) {
      if (avg <= 0) continue;
      const c = A.byCat.get(id), now = c ? c.total : 0;
      const expected = A.isCurrent ? avg * (A.dayIndex / A.p.days) : avg;
      if (expected <= 0) continue;
      const ratio = now / expected, excess = now - expected;
      if (ratio >= 1.4 && excess >= Math.max(A.avgSpend * 0.04, 1) && (!best || excess > best.excess)) best = { id, ratio, excess, now, expected };
    }
    if (best) { const cat = catById(best.id); add(64, 'warn', 'up', cat.name + ' is running ' + pct(best.ratio - 1) + ' above usual', money(best.now) + ' ' + mon + ' against about ' + moneyR(best.expected) + ' by this point in a typical month.', { act: 'filter-cat', arg: best.id, label: 'See entries' }); }
  }
  if (A.savingsRate != null) {
    if (A.saved < 0) add(85, 'bad', 'alert', 'Spent ' + money(-A.saved) + ' more than you earned', 'Income ' + mon + ' is ' + money(A.income) + ' and spending is ' + money(A.spend) + '.');
    else if (A.savingsRate >= 0.2) add(55, 'good', 'piggy', 'You kept ' + pct(A.savingsRate) + ' of your income', money(A.saved) + ' not spent ' + mon + (A.invest ? ', including ' + money(A.invest) + ' invested' : '') + '. The usual target is 20% or more.');
    else add(60, 'warn', 'piggy', 'Saving ' + pct(A.savingsRate) + ' of income so far', 'The common target is 20%. That would mean keeping about ' + moneyR(A.income * 0.2 - A.saved) + ' more ' + mon + '.');
  }
  if (A.unusual) {
    const e = A.unusual.e, cat = catById(e.cat);
    add(52, 'info', 'spark', 'Unusual: ' + money(e.amount) + ' for ' + e.note, 'About ' + Math.round(A.unusual.ratio) + '× your typical ' + cat.name + ' expense of ' + moneyR(A.unusual.med) + '.', { act: 'edit', arg: e.id, label: 'View' });
  }
  if (A.subs.length) {
    const m = sum(A.subs, s => s.monthly);
    add(36, 'info', 'repeat', 'Repeating charges: ' + moneyR(m) + ' a month', A.subs.length + (A.subs.length === 1 ? ' charge' : ' charges') + ', about ' + moneyR(m * 12) + ' a year. Biggest: ' + A.subs[0].name + ' at ' + moneyR(A.subs[0].monthly) + '.');
  }
  if (A.biggest && A.spend > 0) add(30, 'info', 'receipt', 'Biggest expense: ' + A.biggest.note + ', ' + money(A.biggest.amount), pct(A.biggest.amount / A.spend) + ' of everything spent ' + mon + '.', { act: 'edit', arg: A.biggest.id, label: 'View' });
  if (A.weekendRatio >= 1.5 && A.weekdayDays >= 3) add(31, 'info', 'calendar', 'Weekends cost ' + (Math.round(A.weekendRatio * 10) / 10) + '× more per day', 'Day-to-day spending averages ' + money(niceRound((A.weekday[0] + A.weekday[6]) / 2)) + ' on weekend days and ' + money(niceRound((A.weekday[1] + A.weekday[2] + A.weekday[3] + A.weekday[4] + A.weekday[5]) / 5)) + ' on weekdays.');
  if (A.isCurrent && A.noSpendDays >= 3) add(20, 'good', 'leaf', A.noSpendDays + ' no-spend days so far', 'Days with nothing spent ' + mon + '.');
  if (A.topPlaces.length && A.topPlaces[0].count >= 3) add(24, 'info', 'pin', 'Most frequent: ' + A.topPlaces[0].name, A.topPlaces[0].count + ' times, ' + money(A.topPlaces[0].total) + ' in total ' + mon + '.');
  if (A.otherCount >= 3) add(44, 'info', 'tag', A.otherCount + ' entries have no clear category', 'Give them a category and your breakdown gets sharper. I will remember the choice next time.', { act: 'filter-cat', arg: 'other', label: 'Review' });
  if (A.transfer > 0 && A.count) {
    const atm = A.entries.filter(e => kindOf(e) === 'transfer' && /\batm\b|withdraw/i.test(e.note));
    if (atm.length) add(26, 'info', 'cash', 'Cash withdrawn: ' + money(sum(atm, e => e.amount)), 'Withdrawals are not counted as spending. Log what you buy with the cash to see where it goes.');
  }
  return out.sort((a, b) => b.score - a.score);
}
function niceRound(v) {
  if (v <= 0) return 0;
  const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 1));
  return Math.round(v / p) * p;
}
function periodLabel(p) {
  const sd = settings().startDay;
  if (sd === 1) return fmtDate(p.start, { month: 'long', year: 'numeric' });
  return shortDate(p.start) + ' – ' + shortDate(p.end);
}
function periodShort(p) {
  const sd = settings().startDay;
  return sd === 1 ? fmtDate(p.start, { month: 'short' }) : shortDate(p.start);
}

/* ---------- a compact summary Claude can read ---------- */
function buildDigest(A) {
  const n = v => String(Math.round(v * 100) / 100);
  const L = [];
  L.push('Today: ' + A.today + '. Currency: ' + FMT.cur + '. Budget months start on day ' + settings().startDay + '.');
  L.push('Selected period: ' + A.p.start + ' to ' + A.p.end + (A.isCurrent ? ' (day ' + A.dayIndex + ' of ' + A.p.days + ')' : '') + '.');
  L.push('This period: spent ' + n(A.spend) + ', income ' + n(A.income) + ', invested ' + n(A.invest) + ', transfers and card bills (not spending) ' + n(A.transfer) + ', entries ' + A.count + '.' + (A.isCurrent ? ' Projected spending by period end: ' + n(A.projection) + '.' : ''));
  L.push('Previous period: spent ' + n(A.prevSpend) + ', income ' + n(A.prevIncome) + (A.isCurrent ? ', spent by the same day: ' + n(A.prevToDate) : '') + '.');
  const cats = Array.from(A.byCat.entries()).filter(([, v]) => v.kind !== 'income').sort((a, b) => b[1].total - a[1].total).slice(0, 14)
    .map(([id, v]) => catById(id).name + ' ' + n(v.total) + ' (prev ' + n((A.prevByCat.get(id) || { total: 0 }).total) + ', 3-mo avg ' + n(A.avgCat.get(id) || 0) + ')');
  if (cats.length) L.push('Outflow by category this period: ' + cats.join('; ') + '.');
  const inc = Array.from(A.byCat.entries()).filter(([, v]) => v.kind === 'income').map(([id, v]) => catById(id).name + ' ' + n(v.total));
  if (inc.length) L.push('Income by category: ' + inc.join('; ') + '.');
  L.push('Last 6 periods (start date: spent / income): ' + A.hist.map(h => h.p.start + ': ' + n(h.spend) + ' / ' + n(h.income)).join('; ') + '.');
  if (A.budgetTotal) L.push('Monthly budget: ' + n(A.budgetTotal) + '.');
  const bc = Object.keys(A.budgetCats).map(id => catById(id).name + ' ' + n(A.budgetCats[id]) + ' (spent ' + n((A.byCat.get(id) || { total: 0 }).total) + ')');
  if (bc.length) L.push('Category budgets: ' + bc.join('; ') + '.');
  if (A.subs.length) L.push('Repeating charges (monthly equivalent): ' + A.subs.slice(0, 10).map(s => s.name + ' ' + n(s.monthly)).join('; ') + '.');
  if (A.topPlaces.length) L.push('Top places this period: ' + A.topPlaces.map(t => t.name + ' ' + n(t.total) + ' (' + t.count + 'x)').join('; ') + '.');
  L.push('Ledger holds ' + A.total + ' entries' + (A.firstDate ? ' since ' + A.firstDate : '') + '.');
  return L.join('\n');
}
