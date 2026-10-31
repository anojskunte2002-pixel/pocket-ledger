/* ===================== example data: marked, removable, in the viewer's currency ===================== */
const USD_RATES = { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.37, AUD: 1.52, NZD: 1.66, SGD: 1.34, CHF: 0.88, AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31, BHD: 0.38, OMR: 0.38, JPY: 150, CNY: 7.2, HKD: 7.8, TWD: 32, KRW: 1350, MYR: 4.7, IDR: 15800, PHP: 57, THB: 36, VND: 25000, ZAR: 18.5, NGN: 1500, KES: 129, EGP: 48, BRL: 5.4, MXN: 18, ARS: 900, COP: 4000, CLP: 930, PEN: 3.75, SEK: 10.6, NOK: 10.7, DKK: 6.9, PLN: 4.0, CZK: 23, HUF: 360, TRY: 34, ILS: 3.7, RUB: 92, UAH: 41 };
const INR_RATES = { INR: 1, PKR: 3.3, BDT: 1.4, LKR: 3.6, NPR: 1.6 };
function southAsian() { return FMT.cur in INR_RATES; }
function niceExample(v) {
  if (v >= 10000) return Math.round(v / 100) * 100;
  if (v >= 1000) return Math.round(v / 10) * 10;
  if (v >= 200) return Math.round(v / 5) * 5;
  if (v >= 20) return Math.round(v);
  return Math.round(v * 4) / 4;
}
function exAmount(inr, usd) { return niceExample(southAsian() ? inr * INR_RATES[FMT.cur] : usd * (USD_RATES[FMT.cur] || 1)); }
const EX_GLOBAL = { Swiggy: 'DoorDash', Zomato: 'Uber Eats', BigBasket: 'Whole Foods', DMart: "Trader Joe's", Blinkit: 'Instacart', Ola: 'Lyft', 'Third Wave Coffee': 'Blue Bottle', Myntra: 'Target', PVR: 'AMC', BookMyShow: 'Ticketmaster', 'Apollo Pharmacy': 'CVS', Airtel: 'Comcast', Jio: 'T-Mobile', Groww: 'Vanguard', 'Cult.fit': 'Planet Fitness', Croma: 'Best Buy', MakeMyTrip: 'Expedia', 'HDFC Bank': 'Chase', 'Star Health': 'Aetna' };
const exName = n => (southAsian() || !n ? n : (EX_GLOBAL[n] || n));
function exampleTry() {
  const h = household(), other = h.solo ? '' : h.members[1].name;
  return [
    'Coffee ' + exAmount(120, 4.5),
    'Uber ' + exAmount(230, 18) + ' yesterday on card',
    other ? 'Shared groceries ' + exAmount(1240, 86) : 'Groceries ' + exAmount(1240, 86),
    other ? other + ' salary ' + exAmount(72000, 4600) + ' credited' : 'Salary ' + exAmount(85000, 5200) + ' credited',
    'Lunch ' + exAmount(350, 14) + ' and movie ' + exAmount(500, 16)
  ];
}
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function examplePlan() {
  const a = exAmount;
  return {
    incomes: [
      { id: 'xi1', name: 'Salary', who: 'p1', cat: 'salary', amount: a(85000, 5200), day: 1 },
      { id: 'xi2', name: 'Salary', who: 'p2', cat: 'salary', amount: a(72000, 4600), day: 1 },
      { id: 'xi3', name: 'Freelance design', who: 'p2', cat: 'business', amount: a(15000, 900), day: 15 }
    ],
    fixed: [
      { id: 'xf1', name: 'Rent', who: 'joint', cat: 'home', amount: a(22000, 1650), day: 2 },
      { id: 'xf2', name: 'Car EMI', who: 'p1', cat: 'emi', amount: a(12500, 420), day: 5 },
      { id: 'xf3', name: 'Sending home', who: 'p1', cat: 'sendhome', amount: a(10000, 400), day: 7 },
      { id: 'xf4', name: 'Sending home', who: 'p2', cat: 'sendhome', amount: a(8000, 300), day: 8 },
      { id: 'xf5', name: 'Electricity', who: 'joint', cat: 'bills', amount: a(1800, 95), day: 6 },
      { id: 'xf6', name: 'Internet', who: 'joint', cat: 'bills', amount: a(799, 60), day: 9 },
      { id: 'xf7', name: 'Netflix', who: 'joint', cat: 'subs', amount: a(649, 15.49), day: 5 },
      { id: 'xf8', name: 'SIP', who: 'joint', cat: 'invest', amount: a(10000, 500), day: 10 },
      { id: 'xf9', name: 'Health insurance', who: 'p2', cat: 'insurance', amount: a(2400, 180), day: 20 }
    ],
    save: a(25000, 1200),
    sample: true
  };
}
function buildExamples() {
  const rnd = mulberry(20261031);
  const pick = a => a[Math.floor(rnd() * a.length)];
  const between = (a, b) => a + (b - a) * rnd();
  const pickWho = w => (w === 'p1' || w === 'p2' || w === 'joint' ? w : (rnd() < w ? 'p1' : 'p2'));
  const today = todayStr();
  const start = shiftKey(today.slice(0, 7), -2) + '-01';
  const thisMonth = today.slice(0, 7);
  const out = [];
  let n = 0;
  const add = (date, type, cat, note, merchant, method, amount, who, plan) => {
    const created = parseYMD(date).getTime() + 9 * 36e5 + (n++ % 50) * 6e4;
    const by = who === 'joint' ? (rnd() < 0.5 ? 'p1' : 'p2') : who;
    out.push(normEntry('x' + created.toString(36) + n.toString(36), { type, cat, note, merchant: exName(merchant), method, amount, date, who, by, plan: plan || '', source: 'sample', sample: true, created, updated: created }));
  };
  // [category, [note, merchant] pairs, methods, rupee range, dollar range, times a week, weekend boost, whose (share for the first person, or a fixed id)]
  const DAILY = [
    ['food', [['Coffee', 'Third Wave Coffee'], ['Coffee', 'Starbucks'], ['Tea and snacks', '']], ['UPI', 'Card'], [140, 320], [4, 7.5], 3.2, 1, 0.65],
    ['food', [['Lunch', ''], ['Team lunch', '']], ['UPI', 'Card'], [180, 520], [11, 19], 2.2, 0.5, 0.5],
    ['food', [['Dinner out', ''], ['Dinner date', '']], ['Card', 'Credit Card'], [900, 2600], [32, 85], 0.5, 2.2, 'joint'],
    ['food', [['Food delivery', 'Swiggy'], ['Food delivery', 'Zomato']], ['UPI'], [280, 720], [18, 42], 1.2, 1.5, 'joint'],
    ['groceries', [['Groceries', 'BigBasket'], ['Vegetables and fruit', ''], ['Groceries', 'DMart'], ['Milk and bread', 'Blinkit']], ['UPI', 'Card'], [350, 1800], [24, 130], 1.6, 1.3, 'joint'],
    ['transport', [['Cab', 'Uber'], ['Cab to office', 'Ola'], ['Auto', '']], ['UPI', 'Cash'], [110, 420], [9, 28], 2.4, 0.7, 0.45],
    ['transport', [['Metro', '']], ['Card'], [40, 60], [2.75, 2.75], 2, 0.3, 'p2'],
    ['shopping', [['Clothes', 'Myntra'], ['Home supplies', 'Amazon'], ['Phone case', 'Amazon'], ['Books', 'Amazon'], ['Running shoes', 'Decathlon']], ['Credit Card', 'UPI'], [600, 3200], [22, 120], 0.45, 1.6, 0.4],
    ['fun', [['Movie', 'PVR'], ['Bowling', ''], ['Concert tickets', 'BookMyShow']], ['Credit Card', 'UPI'], [350, 1400], [14, 55], 0.35, 2.6, 'joint'],
    ['care', [['Haircut', ''], ['Skincare', 'Nykaa']], ['UPI', 'Cash'], [250, 900], [18, 40], 0.3, 1.4, 0.3],
    ['health', [['Medicines', 'Apollo Pharmacy']], ['UPI'], [240, 900], [12, 38], 0.25, 1, 0.5]
  ];
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const dow = parseYMD(d).getDay(), weekend = dow === 0 || dow === 6;
    for (const t of DAILY) {
      let p = t[5] / 7 * (weekend ? t[6] : 1);
      if (t[0] === 'food' && d.slice(0, 7) === thisMonth) p *= 1.15;
      let k = 0;
      while (p > 0 && k < 3) {
        if (rnd() < Math.min(p, 0.95)) { const nm = pick(t[1]); add(d, 'expense', t[0], nm[0], nm[1], pick(t[2]), exAmount(between(t[3][0], t[3][1]), between(t[4][0], t[4][1])), pickWho(t[7])); }
        p -= 1; k++;
      }
    }
  }
  // [day, type, category, note, merchant, method, rupees, dollars, whose, plan item]
  const MONTHLY = [
    [1, 'income', 'salary', 'Salary', 'Acme Corp', 'Bank Transfer', [85000, 85000], [5200, 5200], 'p1', 'xi1'],
    [1, 'income', 'salary', 'Salary', 'Studio Nine', 'Bank Transfer', [72000, 72000], [4600, 4600], 'p2', 'xi2'],
    [2, 'expense', 'home', 'Rent', '', 'Bank Transfer', [22000, 22000], [1650, 1650], 'joint', 'xf1'],
    [3, 'expense', 'health', 'Gym membership', 'Cult.fit', 'Card', [1500, 1500], [45, 45], 'p1'],
    [5, 'expense', 'emi', 'Car EMI', 'HDFC Bank', 'Bank Transfer', [12500, 12500], [420, 420], 'p1', 'xf2'],
    [5, 'expense', 'subs', 'Netflix', 'Netflix', 'Credit Card', [649, 649], [15.49, 15.49], 'joint', 'xf7'],
    [6, 'expense', 'bills', 'Electricity bill', '', 'UPI', [1350, 2200], [70, 125], 'joint', 'xf5'],
    [7, 'expense', 'sendhome', 'Sending home', '', 'UPI', [10000, 10000], [400, 400], 'p1', 'xf3'],
    [8, 'expense', 'sendhome', 'Sending home', '', 'UPI', [8000, 8000], [300, 300], 'p2', 'xf4'],
    [9, 'expense', 'bills', 'Internet', 'Airtel', 'UPI', [799, 799], [60, 60], 'joint', 'xf6'],
    [10, 'expense', 'invest', 'SIP', 'Groww', 'Bank Transfer', [10000, 10000], [500, 500], 'joint', 'xf8'],
    [12, 'expense', 'subs', 'Spotify', 'Spotify', 'Credit Card', [119, 119], [11.99, 11.99], 'p2'],
    [16, 'income', 'business', 'Freelance design', 'Client', 'Bank Transfer', [12000, 18000], [700, 1100], 'p2', 'xi3'],
    [18, 'expense', 'bills', 'Mobile recharge', 'Jio', 'UPI', [299, 299], [45, 45], 'p1'],
    [18, 'expense', 'bills', 'Mobile recharge', 'Jio', 'UPI', [299, 299], [45, 45], 'p2'],
    [20, 'expense', 'transport', 'Petrol', '', 'Card', [1800, 2600], [42, 60], 'p1'],
    [20, 'expense', 'insurance', 'Health insurance', 'Star Health', 'Card', [2400, 2400], [180, 180], 'p2', 'xf9'],
    [25, 'expense', 'transfer', 'Credit card bill', '', 'Bank Transfer', [9000, 14000], [600, 900], 'joint']
  ];
  for (let k = -2; k <= 0; k++) {
    const mk = shiftKey(thisMonth, k);
    for (const t of MONTHLY) {
      const date = mk + '-' + pad2(t[0]);
      if (date > today) continue;
      if (k === 0 && t[9] === 'xf9') continue;
      add(date, t[1], t[2], t[3], t[4], t[5], exAmount(between(t[6][0], t[6][1]), between(t[7][0], t[7][1])), t[8], t[9]);
    }
  }
  const back = n2 => { const d = addDays(today, -n2); return d < start ? start : d; };
  add(back(5), 'expense', 'shopping', 'Headphones', 'Croma', 'Credit Card', exAmount(5999, 199), 'p1');
  add(back(33), 'expense', 'gifts', 'Birthday gift', '', 'UPI', exAmount(1800, 60), 'p2');
  add(back(30), 'income', 'refund', 'Refund for shoes', 'Myntra', 'UPI', exAmount(1299, 45), 'p2');
  add(back(58), 'expense', 'travel', 'Weekend trip', 'MakeMyTrip', 'Credit Card', exAmount(7400, 380), 'joint');
  add(back(52), 'income', 'returns', 'FD interest', '', 'Bank Transfer', exAmount(1250, 38), 'joint');
  add(back(40), 'income', 'bonus', 'Festival bonus', 'Acme Corp', 'Bank Transfer', exAmount(20000, 800), 'p1');
  return out;
}
function exampleBudgets() {
  return {
    total: 0,
    cats: { food: exAmount(14000, 600), groceries: exAmount(10000, 700), shopping: exAmount(12000, 400), transport: exAmount(6000, 300), fun: exAmount(4000, 180) },
    sample: true
  };
}
