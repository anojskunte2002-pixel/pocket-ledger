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
    const r = Object.assign({}, c, sanitizeCat(over[c.id]), { id: c.id, type: c.type });
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

/* ---------- the household: one or two people, plus "Shared" ---------- */
const SHARED_CATS = new Set(['home', 'groceries', 'bills']);
function household() {
  const h = Store.meta.household || {};
  const raw = Array.isArray(h.members) ? h.members : [];
  const list = [];
  for (const id of ['p1', 'p2']) {
    const m = raw.find(x => x && x.id === id);
    if (m && typeof m.name === 'string' && m.name.trim()) list.push({ id, name: m.name.trim().slice(0, 24) });
  }
  return { members: list, solo: list.length < 2, setup: list.length > 0, sharedDefault: h.sharedDefault !== false };
}
function members() { const h = household(); return h.members.length ? h.members : [{ id: 'p1', name: 'Me' }]; }
function memberName(id) {
  if (id === 'joint') return 'Shared';
  const m = members().find(x => x.id === id);
  return m ? m.name : 'Shared';
}
function initials(name) { return String(name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function whoOf(e) {
  const w = e.who;
  if (w === 'joint') return household().solo ? 'p1' : 'joint';
  if (w === 'p2') return household().solo ? 'p1' : 'p2';
  return 'p1';
}
function meId() { const h = household(); return Prefs.me && (Prefs.me === 'p1' || !h.solo) ? Prefs.me : 'p1'; }
function defaultWhoFor(cat) {
  const h = household();
  if (h.solo) return 'p1';
  if (h.sharedDefault && SHARED_CATS.has(cat)) return 'joint';
  return meId();
}
function parseCtx() {
  const s = settings();
  return { today: todayStr(), dateOrder: s.dateOrder, cats: allCats(), rules: rulesMap(), members: household().solo ? [] : household().members, me: meId() };
}

let SORTED = { v: -1, list: [] };
function sortedEntries() {
  if (SORTED.v !== Store.version) {
    SORTED = { v: Store.version, list: Array.from(Store.entries.values()).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.created - a.created)) };
  }
  return SORTED.list;
}

const FIXED = new Set(['home', 'emi', 'insurance', 'bills', 'subs', 'edu', 'fees', 'sendhome']);
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
function isDiscretionary(e) { return kindOf(e) === 'spend' && !FIXED.has(e.cat) && !e.rec && !e.plan && e.source !== 'recurring'; }
function trimmedSum(amts) {
  if (amts.length < 5) return sum(amts);
  const med = median(amts), total = sum(amts);
  return sum(amts.filter(v => !(v > med * 4 && v > total * 0.25)));
}
function merchantKey(e) { return normText(e.merchant || e.note).trim(); }

/* ---------- the monthly plan: money in, fixed costs, a saving goal ---------- */
function getPlan() {
  const p = Store.meta.plan || {};
  const clean = (arr, kind) => (Array.isArray(arr) ? arr : []).filter(x => x && x.id && +x.amount > 0).map(x => ({
    id: String(x.id).slice(0, 40), kind,
    name: String(x.name || '').trim().slice(0, 60) || (kind === 'income' ? 'Income' : 'Fixed cost'),
    who: x.who === 'p1' || x.who === 'p2' || x.who === 'joint' ? x.who : 'joint',
    cat: String(x.cat || (kind === 'income' ? 'salary' : 'other')),
    amount: round2(+x.amount), day: clamp(parseInt(x.day, 10) || 1, 1, 31), auto: !!x.auto
  }));
  const incomes = clean(p.incomes, 'income'), fixed = clean(p.fixed, 'fixed');
  const save = +p.save > 0 ? round2(+p.save) : 0;
  return { incomes, fixed, save, sample: !!p.sample, exists: !!(incomes.length || fixed.length || save) };
}
function dueDateFor(p, day) {
  const [y, m] = p.start.split('-').map(Number);
  let d = mkDate(y, m, Math.min(day, daysInMonth(y, m - 1)));
  if (d < p.start) {
    const [ny, nm] = shiftKey(p.start.slice(0, 7), 1).split('-').map(Number);
    d = mkDate(ny, nm, Math.min(day, daysInMonth(ny, nm - 1)));
  }
  return d;
}
function planStatus(p, list, today) {
  const plan = getPlan();
  if (!plan.exists) return null;
  const entries = [];
  for (const e of list) { if (e.date > p.end) continue; if (e.date < p.start) break; entries.push(e); }
  const items = plan.incomes.concat(plan.fixed);
  const got = new Map(items.map(it => [it.id, []]));
  const used = new Set();
  for (const e of entries) if (e.plan && got.has(e.plan)) { got.get(e.plan).push(e); used.add(e.id); }
  const cands = [];
  for (const it of items) {
    const words = normText(it.name).trim().split(' ').filter(w => w.length > 2 && ['the', 'and', 'for', 'from', 'home'].indexOf(w) < 0);
    for (const e of entries) {
      if (used.has(e.id) || (it.kind === 'income') !== (e.type === 'income')) continue;
      const hay = ' ' + normText(e.note + ' ' + e.merchant);
      let s = 0;
      if (words.length && words.every(w => hay.indexOf(' ' + w) >= 0)) s += 3;
      else if (words.some(w => hay.indexOf(' ' + w) >= 0)) s += 1.5;
      if (e.cat === it.cat) s += 2;
      const ratio = e.amount / it.amount;
      if (Math.abs(ratio - 1) < 0.005) s += 3; else if (ratio > 0.85 && ratio < 1.15) s += 2; else if (ratio > 0.5 && ratio < 1.5) s += 0.5;
      if (whoOf(e) === it.who) s += 0.5;
      if (s >= 4) cands.push({ it, e, s });
    }
  }
  cands.sort((a, b) => b.s - a.s);
  for (const c of cands) {
    if (used.has(c.e.id)) continue;
    const arr = got.get(c.it.id);
    if (sum(arr, x => x.amount) >= c.it.amount * 0.95) continue;
    arr.push(c.e); used.add(c.e.id);
  }
  const rows = items.map(it => {
    const arr = got.get(it.id), paid = round2(sum(arr, x => x.amount)), due = dueDateFor(p, it.day);
    let state;
    if (paid >= it.amount * 0.95) state = 'done';
    else if (paid > 0) state = 'partial';
    else if (today > due) state = 'late';
    else if (daysBetween(today, due) <= 3) state = 'soon';
    else state = 'upcoming';
    return Object.assign({}, it, { paid, due, state, entries: arr });
  });
  const incomes = rows.filter(r => r.kind === 'income'), fixed = rows.filter(r => r.kind === 'fixed');
  const expectedIncome = sum(incomes, r => r.amount);
  const incomeActual = sum(entries.filter(e => e.type === 'income'), e => e.amount);
  const fixedTotal = sum(fixed, r => r.amount);
  const fixedPaid = sum(fixed, r => Math.min(r.paid, r.amount));
  const everydaySpent = sum(entries.filter(e => kindOf(e) === 'spend' && !used.has(e.id)), e => e.amount);
  const baseIncome = expectedIncome || incomeActual;
  const flexible = baseIncome - fixedTotal - plan.save;
  const fixedLeftSpend = sum(fixed.filter(r => kindOf({ type: 'expense', cat: r.cat }) === 'spend'), r => Math.max(0, r.amount - r.paid));
  return {
    plan, rows, incomes, fixed, expectedIncome, incomeActual, baseIncome, fixedTotal, fixedPaid, fixedLeft: Math.max(0, fixedTotal - fixedPaid), fixedLeftSpend,
    everydaySpent, flexible, flexLeft: flexible - everydaySpent, save: plan.save, used,
    doneCount: fixed.filter(r => r.state === 'done').length, lateCount: fixed.filter(r => r.state === 'late').length
  };
}

/* ---------- one period, for everyone or one person ---------- */
let ANALYSIS = new Map();
function analyze(key, person) {
  person = person || 'all';
  const st = settings();
  const today = todayStr();
  const meta = Store.meta;
  const ck = [Store.version, key, person, st.startDay, today, FMT.cur].concat(['categories', 'budgets', 'recurring', 'household', 'plan'].map(n => meta[n] && meta[n].rev)).join('|');
  const hit = ANALYSIS.get(person);
  if (hit && hit.k === ck) return hit.a;
  const sd = st.startDay;
  const p = periodFromKey(key, sd), pp = periodFromKey(shiftKey(key, -1), sd);
  const everyone = sortedEntries();
  const list = person === 'all' ? everyone : everyone.filter(e => whoOf(e) === person);
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
      if (person !== 'all' && (r.tpl.who || 'p1') !== person) continue;
      let n = r.next;
      while (n > today && n <= p.end) { recurringLeft += +r.tpl.amount || 0; n = nextOccurrence(n, r.every, r.day); }
    }
    projection = cur.spend + rate * daysLeft + fixedLeft + recurringLeft;
  }

  const wEnd = isCurrent ? today : p.end, wStart = addDays(wEnd, -90);
  const wTot = [0, 0, 0, 0, 0, 0, 0], wCnt = [0, 0, 0, 0, 0, 0, 0];
  const firstDate = list.length ? list[list.length - 1].date : wEnd;
  const span0 = firstDate > wStart ? firstDate : wStart;
  for (let d = span0, guard = 0; d <= wEnd && guard < 400; d = addDays(d, 1), guard++) wCnt[parseYMD(d).getDay()]++;
  for (const e of list) {
    if (e.date > wEnd) continue;
    if (e.date < span0) break;
    if (isDiscretionary(e)) wTot[parseYMD(e.date).getDay()] += e.amount;
  }
  const weekday = wTot.map((t, i) => (wCnt[i] ? t / wCnt[i] : 0));
  const wkEnd = (weekday[0] + weekday[6]) / 2, wkDay = (weekday[1] + weekday[2] + weekday[3] + weekday[4] + weekday[5]) / 5;

  const places = new Map(), methods = new Map(), incomeBy = new Map(), catWho = new Map();
  const split = { p1: { spend: 0, income: 0, invest: 0, count: 0 }, p2: { spend: 0, income: 0, invest: 0, count: 0 }, joint: { spend: 0, income: 0, invest: 0, count: 0 } };
  let needs = 0, wants = 0;
  for (const e of cur.entries) {
    const k = kindOf(e), w = whoOf(e), sp = split[w];
    sp.count++;
    if (k === 'spend') {
      sp.spend += e.amount;
      const key2 = merchantKey(e);
      const pl = places.get(key2) || { name: e.merchant || e.note, total: 0, count: 0, cat: e.cat };
      pl.total += e.amount; pl.count++; places.set(key2, pl);
      if (groupOf(e) === 'needs') needs += e.amount; else wants += e.amount;
      const cw = catWho.get(e.cat) || { p1: 0, p2: 0, joint: 0, total: 0 };
      cw[w] += e.amount; cw.total += e.amount; catWho.set(e.cat, cw);
    } else if (k === 'income') {
      sp.income += e.amount;
      const ib = incomeBy.get(e.cat) || { p1: 0, p2: 0, joint: 0, total: 0, count: 0 };
      ib[w] += e.amount; ib.total += e.amount; ib.count++; incomeBy.set(e.cat, ib);
    } else if (k === 'invest') sp.invest += e.amount;
    if (k === 'spend' || k === 'invest') { const m = e.method || 'Not recorded'; methods.set(m, (methods.get(m) || 0) + e.amount); }
  }
  const topPlaces = Array.from(places.values()).sort((a, b) => b.total - a.total).slice(0, 6);
  const methodList = Array.from(methods.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

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
    const med = median(h), ratio = med > 0 ? e.amount / med : 0;
    if (ratio >= 3 && e.amount >= Math.max(avgSpend * 0.04, 1) && (!unusual || ratio > unusual.ratio)) unusual = { e, ratio, med };
  }

  const subs = detectRepeating(list, rules, today);
  const b = budgets();
  const plan = person === 'all' ? planStatus(p, everyone, today) : null;
  const A = {
    key, p, pp, today, person, isCurrent, isFuture, dayIndex, daysLeft,
    spend: cur.spend, income: cur.income, invest: cur.invest, transfer: cur.transfer, count: cur.count,
    byCat: cur.byCat, prevByCat: prev.byCat, avgCat, avgSpend, priorCount: prior.length,
    daily: cur.daily, cum, prevCum, prevToDate,
    prevSpend: prev.spend, prevIncome: prev.income, prevCount: prev.count,
    saved: cur.income - cur.spend, savingsRate: cur.income > 0 ? (cur.income - cur.spend) / cur.income : null,
    avgPerDay: dayIndex ? cur.spend / dayIndex : 0,
    projection, rate, fixedLeft, recurringLeft,
    hist, weekday, weekendRatio: wkDay > 0 ? wkEnd / wkDay : 0, weekdayDays: Math.min(...wCnt),
    topPlaces, methods: methodList, needs, wants, split, catWho, incomeBy,
    unusual, subs, plan,
    budgetTotal: person === 'all' ? b.total : 0, budgetCats: person === 'all' ? b.cats : {},
    entries: cur.entries,
    noSpendDays: dayIndex ? cur.daily.slice(0, dayIndex).filter(v => v === 0).length : 0,
    biggest: cur.entries.filter(e => kindOf(e) === 'spend').sort((a, c) => c.amount - a.amount)[0] || null,
    otherCount: cur.entries.filter(e => e.cat === 'other' || e.cat === 'other_in').length,
    total: list.length, firstDate: list.length ? list[list.length - 1].date : ''
  };
  if (plan) {
    A.everydayProjected = plan.everydaySpent + (isCurrent ? rate * daysLeft : 0);
    A.planProjection = cur.spend + plan.fixedLeftSpend + (isCurrent ? rate * daysLeft : 0);
    A.projectedSave = Math.max(plan.expectedIncome, plan.incomeActual) - A.planProjection;
  }
  A.insights = buildInsights(A);
  ANALYSIS.set(person, { k: ck, a: A });
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
  if (!A.count && !A.total && !A.plan) return out;
  const P = A.plan;
  if (P && A.isCurrent) {
    for (const r of P.fixed) {
      if (r.state === 'late') add(97, 'bad', 'alert', r.name + ' was due ' + (/^(?:Today|Yesterday)$/.test(dayLabel(r.due)) ? dayLabel(r.due).toLowerCase() : 'on ' + dayLabel(r.due)), money(r.amount) + (r.who === 'joint' ? ' from the shared budget' : ' for ' + memberName(r.who)) + ' is still unpaid.', { act: 'plan-pay', arg: r.id, label: 'Mark paid' });
      else if (r.state === 'soon') add(78, 'warn', 'calendar', r.name + ' is due ' + (r.due === A.today ? 'today' : dayLabel(r.due).toLowerCase() === 'tomorrow' ? 'tomorrow' : 'on ' + shortDate(r.due)), money(r.amount) + ' · ' + memberName(r.who) + '.', { act: 'plan-pay', arg: r.id, label: 'Mark paid' });
    }
    for (const r of P.incomes) if (r.state === 'late') add(58, 'info', 'clock', r.name + ' hasn’t come in yet', 'Expected ' + money(r.amount) + ' on ' + shortDate(r.due) + (r.who !== 'joint' ? ' for ' + memberName(r.who) : '') + '.', { act: 'plan-pay', arg: r.id, label: 'Mark received' });
    if (P.flexible > 0 && A.dayIndex >= 3) {
      if (A.everydayProjected > P.flexible * 1.02) add(92, 'warn', 'trend', 'Everyday spending is heading ' + moneyR(A.everydayProjected - P.flexible) + ' over plan', 'At this pace it ends near ' + money(niceRound(A.everydayProjected)) + ' against ' + money(P.flexible) + ' planned. Keeping to ' + moneyR(Math.max(0, P.flexLeft) / Math.max(1, A.daysLeft + 1)) + ' a day gets you back on plan.');
      else add(52, 'good', 'check', moneyR(Math.max(0, P.flexLeft)) + ' safe to spend', 'About ' + moneyR(Math.max(0, P.flexLeft) / Math.max(1, A.daysLeft + 1)) + ' a day for the rest of the month, with every planned bill and the saving goal covered.');
    }
    if (P.save > 0) {
      if (A.projectedSave >= P.save) add(48, 'good', 'piggy', 'On track to save ' + moneyR(A.projectedSave), 'Your goal is ' + money(P.save) + ' this month.');
      else add(66, 'warn', 'piggy', 'Saving goal at risk', 'You are on course to save ' + moneyR(Math.max(0, A.projectedSave)) + ' against a goal of ' + money(P.save) + '.');
    }
  } else if (A.budgetTotal) {
    const left = A.budgetTotal - A.spend;
    if (left < 0) add(100, 'bad', 'alert', 'Over budget by ' + money(-left), 'You have spent ' + money(A.spend) + ' of your ' + money(A.budgetTotal) + ' budget ' + mon + '.');
    else if (A.isCurrent && A.dayIndex >= 3 && A.projection > A.budgetTotal * 1.02) add(90, 'warn', 'trend', 'Heading ' + moneyR(A.projection - A.budgetTotal) + ' over budget', 'At your current pace this month ends near ' + money(niceRound(A.projection)) + '. Keeping to ' + moneyR(Math.max(0, left / Math.max(1, A.daysLeft + 1))) + ' a day gets you back under.');
    else if (A.isCurrent && A.dayIndex >= 3) add(50, 'good', 'check', 'On track for your budget', 'Projected ' + money(niceRound(A.projection)) + ' by month end, ' + moneyR(A.budgetTotal - A.projection) + ' under. You can spend about ' + moneyR(left / Math.max(1, A.daysLeft + 1)) + ' a day.');
  } else if (A.person === 'all' && A.priorCount >= 1 && A.avgSpend > 0) {
    add(42, 'info', 'target', 'Plan your month', 'You usually spend about ' + money(niceRound(A.avgSpend)) + ' a month. Add your income and fixed costs to see what is safe to spend.', { act: 'tab', arg: 'plan', label: 'Open plan' });
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
  if (A.savingsRate != null && !(P && P.save > 0)) {
    if (A.saved < 0) add(85, 'bad', 'alert', 'Spent ' + money(-A.saved) + ' more than came in', 'Income ' + mon + ' is ' + money(A.income) + ' and spending is ' + money(A.spend) + '.');
    else if (A.savingsRate >= 0.2) add(55, 'good', 'piggy', 'You kept ' + pct(A.savingsRate) + ' of your income', money(A.saved) + ' not spent ' + mon + (A.invest ? ', including ' + money(A.invest) + ' invested' : '') + '. The usual target is 20% or more.');
    else add(60, 'warn', 'piggy', 'Saving ' + pct(A.savingsRate) + ' of income so far', 'The common target is 20%. That would mean keeping about ' + moneyR(A.income * 0.2 - A.saved) + ' more ' + mon + '.');
  }
  if (A.person === 'all' && !household().solo && A.spend > 0) {
    const s = A.split, j = s.joint.spend / A.spend;
    const m = members();
    if (s.p1.spend + s.p2.spend > 0) add(34, 'info', 'people', 'Shared costs are ' + pct(j) + ' of spending', m[0].name + ' ' + money(s.p1.spend) + ', ' + m[1].name + ' ' + money(s.p2.spend) + ' and ' + money(s.joint.spend) + ' shared ' + mon + '.', { act: 'tab', arg: 'insights', label: 'See the split' });
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
  if (A.otherCount >= 3) add(44, 'info', 'tag', A.otherCount + ' entries have no clear category', 'Give them a category and your breakdown gets sharper. The app remembers your choice next time.', { act: 'filter-cat', arg: 'other', label: 'Review' });
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
  const h = household();
  L.push('Today: ' + A.today + '. Currency: ' + FMT.cur + '. Budget months start on day ' + settings().startDay + '.');
  if (!h.solo) L.push('Household: ' + h.members.map(m => m.name).join(' and ') + '. Entries belong to one of them or are Shared.' + (A.person !== 'all' ? ' This summary covers ' + memberName(A.person) + ' only.' : ''));
  L.push('Selected period: ' + A.p.start + ' to ' + A.p.end + (A.isCurrent ? ' (day ' + A.dayIndex + ' of ' + A.p.days + ')' : '') + '.');
  L.push('This period: spent ' + n(A.spend) + ', income ' + n(A.income) + ', invested ' + n(A.invest) + ', transfers and card bills (not spending) ' + n(A.transfer) + ', entries ' + A.count + '.' + (A.isCurrent ? ' Projected spending by period end: ' + n(A.projection) + '.' : ''));
  if (A.person === 'all' && !h.solo) L.push('By person this period (spent / income): ' + ['p1', 'p2', 'joint'].map(w => memberName(w) + ' ' + n(A.split[w].spend) + ' / ' + n(A.split[w].income)).join('; ') + '.');
  L.push('Previous period: spent ' + n(A.prevSpend) + ', income ' + n(A.prevIncome) + (A.isCurrent ? ', spent by the same day: ' + n(A.prevToDate) : '') + '.');
  const cats = Array.from(A.byCat.entries()).filter(([, v]) => v.kind !== 'income').sort((a, b) => b[1].total - a[1].total).slice(0, 14)
    .map(([id, v]) => catById(id).name + ' ' + n(v.total) + ' (prev ' + n((A.prevByCat.get(id) || { total: 0 }).total) + ', 3-mo avg ' + n(A.avgCat.get(id) || 0) + ')');
  if (cats.length) L.push('Outflow by category this period: ' + cats.join('; ') + '.');
  const inc = Array.from(A.incomeBy.entries()).map(([id, v]) => catById(id, 'income').name + ' ' + n(v.total));
  if (inc.length) L.push('Income by source: ' + inc.join('; ') + '.');
  if (A.plan) {
    const P = A.plan;
    L.push('Monthly plan: expected income ' + n(P.expectedIncome) + ' (' + P.incomes.map(r => r.name + ' ' + n(r.amount) + ' ' + r.state).join(', ') + '); fixed costs ' + n(P.fixedTotal) + ' (' + P.fixed.map(r => r.name + ' ' + n(r.amount) + ' due ' + r.due + ' ' + r.state).join(', ') + '); saving goal ' + n(P.save) + '; everyday budget ' + n(P.flexible) + ', everyday spent ' + n(P.everydaySpent) + '.');
  }
  L.push('Last 6 periods (start date: spent / income): ' + A.hist.map(x => x.p.start + ': ' + n(x.spend) + ' / ' + n(x.income)).join('; ') + '.');
  if (A.budgetTotal) L.push('Monthly budget: ' + n(A.budgetTotal) + '.');
  const bc = Object.keys(A.budgetCats).map(id => catById(id).name + ' ' + n(A.budgetCats[id]) + ' (spent ' + n((A.byCat.get(id) || { total: 0 }).total) + ')');
  if (bc.length) L.push('Category budgets: ' + bc.join('; ') + '.');
  if (A.subs.length) L.push('Repeating charges (monthly equivalent): ' + A.subs.slice(0, 10).map(s => s.name + ' ' + n(s.monthly)).join('; ') + '.');
  if (A.topPlaces.length) L.push('Top places this period: ' + A.topPlaces.map(t => t.name + ' ' + n(t.total) + ' (' + t.count + 'x)').join('; ') + '.');
  L.push('Ledger holds ' + A.total + ' entries' + (A.firstDate ? ' since ' + A.firstDate : '') + '.');
  return L.join('\n');
}
