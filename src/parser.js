/* ===================== parser: plain words → ledger drafts ===================== */

const SMALL_NUMS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALE_NUMS = { thousand: 1e3, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, crore: 1e7, crores: 1e7, million: 1e6, millions: 1e6, billion: 1e9, billions: 1e9 };


/* Voice and casual typing → digits ("two hundred fifty" → 250, "2 thousand 500" → 2500, "4 dollars 50 cents" → 4.50). */
const isScaleWord = w => w === 'hundred' || w in SCALE_NUMS;
const isNumWord = w => w in SMALL_NUMS || isScaleWord(w);
function normalizeSpoken(s) {
  let t = String(s).replace(/[‘’`]/g, "'").replace(/[“”]/g, '"').replace(/ /g, ' ').replace(/[ \t]+/g, ' ');
  const toks = t.match(/\d+(?:\.\d+)?|[A-Za-z]+|[^A-Za-z\d]/g) || [];
  const low = toks.map(x => x.toLowerCase());
  const nextWord = j => { j++; while (j < toks.length && /^[\s-]$/.test(toks[j])) j++; return j; };
  let out = '', i = 0;
  while (i < toks.length) {
    const lw = low[i], nw = nextWord(i);
    const startsRun = isNumWord(lw) || ((lw === 'a' || lw === 'an' || /^\d/.test(lw)) && nw < toks.length && isScaleWord(low[nw]));
    if (!startsRun) { out += toks[i]; i++; continue; }
    const parts = [];
    let j = i, endTok = i, lastKind = '';
    while (j < toks.length) {
      const x = low[j];
      if (/^[\s-]$/.test(x)) { j++; continue; }
      if (x === 'and' && parts.length) {
        const k = nextWord(j);
        if (k < toks.length && (isNumWord(low[k]) || (lastKind === 'scale' && /^\d/.test(low[k])))) { j = k; continue; }
        break;
      }
      let kind = '';
      if (isScaleWord(x)) kind = 'scale';
      else if (x in SMALL_NUMS) kind = lastKind === 'word' && SMALL_NUMS[x] >= 10 ? '' : 'word';
      else if ((x === 'a' || x === 'an') && !parts.length) kind = 'a';
      else if (/^\d/.test(x) && (!parts.length || lastKind === 'scale')) kind = 'digit';
      if (!kind) break;
      parts.push({ kind, x }); lastKind = kind; endTok = j; j++;
    }
    if (!parts.some(p => p.kind === 'word' || p.kind === 'scale')) { out += toks[i]; i++; continue; }
    let total = 0, cur = 0;
    for (const p of parts) {
      if (p.kind === 'a') cur = 1;
      else if (p.kind === 'digit') cur += parseFloat(p.x);
      else if (p.kind === 'word') cur += SMALL_NUMS[p.x];
      else if (p.x === 'hundred') cur = (cur || 1) * 100;
      else { total += (cur || 1) * SCALE_NUMS[p.x]; cur = 0; }
    }
    out += String(round2(total + cur));
    i = endTok + 1;
  }
  t = out.replace(/(\d+)\s*(dollars?|bucks|euros?|pounds?)\s*(?:and\s*)?(\d{1,2})\s*(?:cents?|pence|p)\b/gi, (m, a, w, c) => a + '.' + pad2(+c) + ' ' + w);
  t = t.replace(/\b(\d{1,2})\s*cents\b/gi, (m, c) => '0.' + pad2(+c) + ' dollars');
  return t;
}

/* Numbers that are part of names or ids, masked so they are never read as amounts (length preserved). */
const MASKS = [/\b401\s*\(?k\)?/gi, /\b403\s*\(?b\)?/gi, /\b529\s+plan\b/gi, /\b(?:tata\s+)?1\s?mg\b/gi, /\b7[\s-]?eleven\b/gi, /\b24\s*[x/]\s*7\b/gi, /\b[2-5]g\b/gi,
  /\bcovid[\s-]?19\b/gi, /\bzee\s?5\b/gi, /\bbox\s?8\b/gi, /\bps\s?[2-5]\b/gi, /\bo2\b/gi, /\bh2o\b/gi, /\biphone\s*\d{1,2}\b/gi, /\bpixel\s*\d{1,2}\b/gi, /\bgalaxy\s*[a-z]?\d{1,3}\b/gi,
  /\bwin(?:dows)?\s*1[01]\b/gi, /\bf1\b/gi, /\b\d{1,2}(?:st|nd|rd|th)\s+floor\b/gi, /\b\d+\s*bhk\b/gi, /\bsector\s*\d+\b/gi, /\bphase\s*\d+\b/gi, /\bxx+\d+\b/gi, /[*x]{2,}\d{3,}/gi,
  /\b(?:a\/c|acct|account)\s*(?:no\.?\s*)?[x*]*\d+\b/gi, /\bref(?:erence)?\.?\s*(?:no\.?|number|#)?\s*:?\s*\d+\b/gi, /\b(?:upi|txn|transaction)\s*(?:ref|id|no)\.?\s*:?\s*\d+\b/gi];
function maskText(s) { for (const re of MASKS) s = s.replace(re, m => m.replace(/\d/g, '§')); return s; }

const CUR_PRE = '₹|rs\\.?|inr|\\$|usd|us\\$|€|eur|£|gbp|¥|jpy|aed|dhs?|sgd|aud|cad';
const CUR_POST = '₹|rs\\.?|rupees?|inr|bucks|dollars?|usd|euros?|eur|pounds?|quid|gbp|yen|jpy|dirhams?|aed';
const AMT_RE = new RegExp('([+\\-−]?)\\s*(' + CUR_PRE + ')?\\s*(\\d{1,3}(?:,\\d{2,3})+(?:\\.\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?(?!\\d))' +
  '(?:\\s*(k|thousand|lakhs?|lacs?|crores?|cr|mn|million|bn|billion)\\b|(l|m)\\b)?(?:\\s*(' + CUR_POST + ')(?![a-z]))?', 'gi');
const MULT = { k: 1e3, thousand: 1e3, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, l: 1e5, crore: 1e7, crores: 1e7, cr: 1e7, mn: 1e6, million: 1e6, m: 1e6, bn: 1e9, billion: 1e9 };
const MON_NAMES = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const UNIT_AFTER = /^\s*(?:kgs?|g|gms?|grams?|ltrs?|litres?|liters?|ml|kms?|miles?|mi|pcs?|pieces?|nos|units?|items?|people|persons?|pax|guests?|tickets?|nights?|days?|weeks?|hrs?|hours?|mins?|minutes?|months?|years?|yrs?|times|x\b|×|%|percent|ways|seats?|plates?|cups?|glass(?:es)?|bottles?|packs?|packets?|boxes|dozen|kids?|adults?|members?|floors?|stars?|gb|mb|tb|inch(?:es)?|ft|feet|cm|mm|sq\.?\s?ft|sqft|°|per\b(?!\s*(?:month|week|year|annum|mo|yr))|\/\s*(?:kg|l|litre|liter|pc|piece|unit|day|hr|hour|night|person)\b)/i;
const ID_BEFORE = /(?:\bx|×|\bqty|\bquantity|\bno\.?|#|\bref|\bending|\broom|\bflat|\bseat|\btable|\bgate|\bplatform|\border|\bid|\bpin|\botp|\broute|\bblock|\blane|\bstreet|\bplot|\bfloor|\bapt|\bunit|\blevel|\bversion|\bv)\s*$/i;

function parseNumberToken(num) {
  if (/^\d+,\d{2}$/.test(num) || /^\d+,\d$/.test(num)) return parseFloat(num.replace(',', '.'));
  return parseFloat(num.replace(/,/g, ''));
}

function findAmounts(masked) {
  const out = [];
  const re = new RegExp(AMT_RE.source, 'gi');
  let m;
  while ((m = re.exec(masked))) {
    const full = m[0], sign = m[1], cpre = m[2], num = m[3], mult1 = m[4], mult2 = m[5], cpost = m[6];
    if (!full.trim() || !num) { re.lastIndex = m.index + 1; continue; }
    const start = m.index + (full.length - full.replace(/^\s+/, '').length), numStart = m.index + full.indexOf(num);
    let end = m.index + full.length;
    while (end > start && /\s/.test(masked[end - 1])) end--;
    const prev = masked[start - 1];
    if (prev && /[a-z0-9§_]/i.test(prev)) {
      if (numStart > start) re.lastIndex = numStart;
      continue;
    }
    let val = parseNumberToken(num);
    const mk = (mult1 || mult2 || '').toLowerCase();
    if (mk) val *= MULT[mk];
    val = round2(val);
    if (!(val > 0)) continue;
    const before = masked.slice(Math.max(0, start - 24), start).toLowerCase();
    const after = masked.slice(end, end + 24).toLowerCase();
    const hasCur = !!(cpre || cpost);
    if (!hasCur && !mk) {
      if (/^\s*(?:st|nd|rd|th)\b/.test(after)) continue;
      if (new RegExp('^\\s*(?:of\\s+)?' + MON_NAMES + '\\b').test(after)) continue;
      if (new RegExp('\\b' + MON_NAMES + '\\.?\\s*$').test(before)) continue;
      if (/^\d{4}$/.test(num) && +num >= 1990 && +num <= 2099 && /(?:\bin|\bof|\bsince|\byear|\bfrom|\btill|\buntil)\s*$/.test(before)) continue;
      if (num.replace(/\D/g, '').length >= 9) continue;
    }
    if (/^[/\-.]\d/.test(masked.slice(end, end + 2)) || /\d[/-]$/.test(before)) continue;
    if (/^\s*(?::\d{2}|[ap]\.?m\b|o'?clock|hrs\b)/.test(after) || /\d:\s*$/.test(before)) continue;
    let score = 0;
    if (hasCur) score += 5;
    if (mult1) score += 2;
    if (UNIT_AFTER.test(after)) score -= 6;
    if (ID_BEFORE.test(before)) score -= 6;
    if (/^\s*x\s*\d/.test(after)) score -= 4;
    out.push({ start, end, val, score, hasCur, sign: sign || '', product: false });
  }
  const px = /(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)(?![\d.])/gi;
  while ((m = px.exec(masked))) {
    const a = +m[1], b = +m[2];
    if (a > 0 && b > 0 && (a <= 50 || b <= 50)) out.push({ start: m.index, end: m.index + m[0].length, val: round2(a * b), score: 3, hasCur: false, sign: '', product: true });
  }
  return out;
}
function pickAmount(c) {
  if (!c.length) return null;
  return c.slice().sort((a, b) => b.score - a.score || (b.product - a.product) || b.val - a.val)[0];
}

/* ---------- dates ---------- */
const MONTH_NUM = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const WEEKDAYS = { sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, weds: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6 };
function mkDate(y, mo, d) {
  if (!(mo >= 1 && mo <= 12 && d >= 1 && y >= 1970 && y <= 2200 && d <= daysInMonth(y, mo - 1))) return null;
  return ymd(new Date(y, mo - 1, d));
}
function monthNum(word) { return MONTH_NUM[String(word).toLowerCase().slice(0, 3)] || 0; }
function fixYear(y) { y = +y; return y < 100 ? 2000 + y : y; }
function pastSameYear(today, mo, d) {
  const y = +today.slice(0, 4);
  let s = mkDate(y, mo, d);
  if (s && daysBetween(today, s) > 60) s = mkDate(y - 1, mo, d);
  return s;
}

function detectDate(s, ctx) {
  const t = s.toLowerCase();
  const today = (ctx && ctx.today) || todayStr();
  const order = (ctx && ctx.dateOrder) || 'DMY';
  const hit = (date, m, idx) => {
    if (!date) return null;
    const off = idx == null ? m.index : idx;
    return { date, start: off, end: m.index + m[0].length };
  };
  let m;
  if ((m = /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/.exec(t))) { const r = hit(mkDate(+m[1], +m[2], +m[3]), m); if (r) return r; }
  if ((m = /(?:^|[^\d.,])(\d{1,2})([/-])(\d{1,2})(?:\2(\d{4}|\d{2}))?(?![\d/])/.exec(t)) || (m = /(?:^|[^\d.,])(\d{1,2})(\.)(\d{1,2})\.(\d{4}|\d{2})(?!\d)/.exec(t))) {
    let a = +m[1], b = +m[3], d, mo;
    if (a > 12) { d = a; mo = b; } else if (b > 12) { d = b; mo = a; } else if (order === 'MDY') { mo = a; d = b; } else { d = a; mo = b; }
    const idx = m.index + m[0].indexOf(m[1]);
    const date = m[4] ? mkDate(fixYear(m[4]), mo, d) : pastSameYear(today, mo, d);
    const r = hit(date, m, idx); if (r) return r;
  }
  if ((m = new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?[\\s-]*(' + MON_NAMES + ')\\.?(?:[\\s,-]*(\\d{4}|\\d{2})(?!\\d))?\\b').exec(t))) {
    const mo = monthNum(m[2]);
    if (mo) { const date = m[3] ? mkDate(fixYear(m[3]), mo, +m[1]) : pastSameYear(today, mo, +m[1]); const r = hit(date, m); if (r) return r; }
  }
  if ((m = new RegExp('\\b(' + MON_NAMES + ')\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4})\\b)?').exec(t))) {
    const mo = monthNum(m[1]);
    if (mo) { const date = m[3] ? mkDate(+m[3], mo, +m[2]) : pastSameYear(today, mo, +m[2]); const r = hit(date, m); if (r) return r; }
  }
  if ((m = /\bday before yesterday\b/.exec(t))) return hit(addDays(today, -2), m);
  if ((m = /\b(?:yesterday|yday|yest|ystrday|yesterdy|last night)\b/.exec(t))) return hit(addDays(today, -1), m);
  if ((m = /\b(?:today|tonight|this (?:morning|afternoon|evening)|right now)\b/.exec(t))) return hit(today, m);
  if ((m = /\b(?:day after tomorrow)\b/.exec(t))) return hit(addDays(today, 2), m);
  if ((m = /\btomorrow\b/.exec(t))) return hit(addDays(today, 1), m);
  if ((m = /\b(\d{1,2}|a|an)\s+days?\s+(?:ago|back|before)\b/.exec(t))) return hit(addDays(today, -(/^\d/.test(m[1]) ? +m[1] : 1)), m);
  if ((m = /\b(?:(?:a|one|1)\s+week\s+ago|last\s+week)\b/.exec(t))) return hit(addDays(today, -7), m);
  if ((m = /\b(?:(last|this|on|past|previous)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues?|weds?|thur?s?|fri|sat)\b/.exec(t))) {
    if (m[2].length > 4 || m[1]) {
      const target = WEEKDAYS[m[2]];
      const dow = parseYMD(today).getDay();
      let diff = (dow - target + 7) % 7;
      if (diff === 0 && m[1] && /last|past|previous/.test(m[1])) diff = 7;
      return hit(addDays(today, -diff), m);
    }
  }
  if ((m = /\b(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)\b(?!\s*(?:floor|time|anniversary|birthday|place|gen|grade|standard|class|row))/.exec(t))) {
    const day = +m[1];
    const [y, mo, d0] = today.split('-').map(Number);
    let date = mkDate(y, mo, day);
    if (date && day > d0) { const pk = shiftKey(today.slice(0, 7), -1).split('-').map(Number); date = mkDate(pk[0], pk[1], Math.min(day, daysInMonth(pk[0], pk[1] - 1))); }
    const r = hit(date, m); if (r) return r;
  }
  return null;
}

/* ---------- payment method, repeats ---------- */
const METHOD_MASK = /credit\s*card\s+(?:bill|payment|dues?)|cc\s+(?:bill|payment)|card\s+(?:bill|dues?)|metro\s+card|gift\s+card|sim\s+card|greeting\s+card|memory\s+card|sd\s+card|id\s+card|aadhaa?r\s+card|pan\s+card|business\s+card|smart\s+card|card\s+game|cash\s*back|cash\s+withdraw\w*/gi;
const PREP = '(?:(?:paid\\s+)?(?:via|using|by|with|on|through|thru|from|in)\\s+(?:my\\s+|the\\s+)?)?';
const METHOD_RES = [
  ['Credit Card', new RegExp('\\b' + PREP + '(?:credit\\s*card|cc|amex|american\\s+express)\\b', 'i')],
  ['UPI', new RegExp('\\b' + PREP + '(?:upi|gpay|g\\s?pay|google\\s?pay|phonepe|phone\\s?pe|paytm(?:\\s+upi)?|bhim|cred\\s+upi|scan\\s+(?:and|&)\\s+pay|qr(?:\\s+code)?)\\b', 'i')],
  ['Card', new RegExp('\\b' + PREP + '(?:debit\\s*card|card|swiped?|mastercard|master\\s*card|rupay|pos|tap(?:ped)?\\s+to\\s+pay|apple\\s?pay|google\\s?wallet|samsung\\s?pay)\\b', 'i')],
  ['Bank Transfer', new RegExp('\\b' + PREP + '(?:neft|imps|rtgs|bank\\s+transfer|net\\s?banking|netbanking|online\\s+banking|wire(?:\\s+transfer)?|ach|zelle|cheque)\\b', 'i')],
  ['Wallet', /\b(?:(?:paid\s+)?(?:via|using|by|with|through|from)\s+(?:my\s+)?wallet|(?:(?:paid\s+)?(?:via|using|by|with|through|from|on)\s+)?(?:paypal|venmo|cash\s?app|revolut|amazon\s+pay|mobikwik|freecharge|paytm\s+wallet))\b/i],
  ['Cash', new RegExp('\\b' + PREP + 'cash\\b(?!\\s*back)', 'i')]
];
function detectMethod(s) {
  const t = s.replace(METHOD_MASK, x => ' '.repeat(x.length));
  for (const [name, re] of METHOD_RES) {
    const m = re.exec(t);
    if (m) return { method: name, start: m.index, end: m.index + m[0].length };
  }
  return null;
}
const REPEAT_RES = [
  ['monthly', /\b(?:every\s+month|each\s+month|monthly|per\s+month|a\s+month(?!\s+ago)|\/\s?(?:month|mo)\b|every\s+30\s+days)\b/i],
  ['weekly', /\b(?:every\s+week|each\s+week|weekly|per\s+week|a\s+week(?!\s+ago)|\/\s?(?:week|wk)\b)\b/i],
  ['yearly', /\b(?:every\s+year|each\s+year|yearly|annually|per\s+year|per\s+annum|a\s+year(?!\s+ago)|\/\s?(?:year|yr)\b)\b/i]
];
function detectRepeat(s) {
  for (const [name, re] of REPEAT_RES) { const m = re.exec(s); if (m) return { repeat: name, start: m.index, end: m.index + m[0].length }; }
  return null;
}

/* ---------- income vs expense ---------- */
function detectType(lc, sign) {
  if (sign === '+') return { type: 'income', strong: true };
  if (sign === '-' || sign === '−') return { type: 'expense', strong: true };
  let t = ' ' + lc + ' ', inc = 0, exp = 0;
  const STAFF = '(?:maid|cook|driver|staff|nanny|helper|employee|guard|watchman|gardener|servant|cleaner)s?';
  const EXP_P = new RegExp("\\b(?:paid\\s+(?:the\\s+|my\\s+|our\\s+)?" + STAFF + "(?:'s)?\\s+(?:salary|wages?)|(?:salary|wages?)\\s+(?:paid\\s+)?(?:to|for)\\s+(?:the\\s+|my\\s+|our\\s+)?" + STAFF + "|" + STAFF + "(?:'s)?\\s+(?:salary|wages?)|paid\\s+(?:salary|wages?)\\s+to)\\b", 'g');
  const INC_P = /\b(?:got paid|get paid|was paid|been paid|paid me|sent me|gave me|transferred me|returned me|payday|pay day)\b/g;
  let x = t.match(EXP_P); if (x) { exp += 4 * x.length; t = t.replace(EXP_P, ' '); }
  x = t.match(INC_P); if (x) { inc += 3 * x.length; t = t.replace(INC_P, ' '); }
  const INC3 = /\b(?:salary|salaries|salery|paycheck|paycheque|pay ?check|payroll|payslip|stipend|pension|credited|received|recieved|refund(?:ed|s)?|cash ?back|reimburse(?:d|ment)?|dividends?|bonus|rent received|rental income|gift from|gifted by|interest (?:earned|received|credited))\b/g;
  const INC2 = /\b(?:wages?|income|earned|earning|earnings|receive|incentives?|commission|sold|winnings|won|prize|lottery)\b/g;
  x = t.match(INC3); if (x) { inc += 3 * x.length; t = t.replace(INC3, ' '); }
  x = t.match(INC2); if (x) { inc += 2 * x.length; t = t.replace(INC2, ' '); }
  const EXP2 = /\b(?:spent|spend|spending|paid|pay|paying|payed|bought|buy|buying|purchased?|ordered|debited|cost|costs|charged|gave|give|donated|tipped|emi|bill|fees?|fine|rent)\b/g;
  x = t.match(EXP2); if (x) exp += 2 * x.length;
  if (/\bgot\b/.test(t) && /\bfrom\b/.test(t)) inc += 1;
  if (inc > exp) return { type: 'income', strong: true };
  if (exp > 0) return { type: 'expense', strong: true };
  return { type: 'expense', strong: false };
}

/* ---------- categories ---------- */
const RULE_CACHE = { src: null, list: [] };
function ruleList(rules) {
  if (RULE_CACHE.src === rules) return RULE_CACHE.list;
  const list = [];
  for (const key in (rules || {})) {
    if (!rules[key]) continue;
    try { list.push({ key, cat: rules[key], re: kwRegex(key) }); } catch (e) { /* skip */ }
  }
  list.sort((a, b) => b.key.length - a.key.length);
  RULE_CACHE.src = rules; RULE_CACHE.list = list;
  return list;
}
function scoreCats(text, cats) {
  const nt = normText(text);
  const scores = {}, brands = {};
  for (const k of kwIndex()) {
    if (k.re.test(nt)) {
      scores[k.cat] = (scores[k.cat] || 0) + k.w;
      if (k.brand && (!brands[k.cat] || k.len > brands[k.cat].len)) brands[k.cat] = { name: k.brand, len: k.len };
    }
  }
  for (const c of cats) {
    if (c.hidden) continue;
    const nm = normText(c.name).trim();
    if (!nm) continue;
    if (kwRegex(nm).test(nt)) scores[c.id] = (scores[c.id] || 0) + (KW[c.id] ? 2 : 4);
    else if (!KW[c.id]) {
      const first = nm.split(' ')[0];
      if (first.length >= 4 && kwRegex(first).test(nt)) scores[c.id] = (scores[c.id] || 0) + 2;
    }
  }
  return { scores, brands };
}
function bestCat(scores, cats, type) {
  let best = null;
  for (const c of cats) {
    if (c.hidden || c.type !== type) continue;
    const s = scores[c.id] || 0;
    if (s > 0 && (!best || s > best.score)) best = { cat: c.id, score: s };
  }
  return best;
}
function categorize(text, typeInfo, ctx) {
  const cats = ctx.cats || DEFAULT_CATS;
  const nt = normText(text);
  for (const r of ruleList(ctx.rules)) {
    if (!r.re.test(nt)) continue;
    const c = cats.find(x => x.id === r.cat && !x.hidden);
    if (!c) continue;
    if (typeInfo.strong && c.type !== typeInfo.type) continue;
    return { type: c.type, cat: c.id, score: 9, source: 'rule', brand: '' };
  }
  const { scores, brands } = scoreCats(text, cats);
  const be = bestCat(scores, cats, 'expense'), bi = bestCat(scores, cats, 'income');
  let type = typeInfo.type;
  if (!typeInfo.strong && bi && (!be || bi.score > be.score)) type = 'income';
  const b = type === 'income' ? bi : be;
  if (b) return { type, cat: b.cat, score: b.score, source: 'keyword', brand: brands[b.cat] ? brands[b.cat].name : '' };
  return { type, cat: type === 'income' ? 'other_in' : 'other', score: 0, source: 'default', brand: '' };
}
function catFromText(text, type, ctx) { return categorize(text, { type: type || 'expense', strong: !!type }, ctx); }

/* ---------- note + merchant ---------- */
const FILLER_LEAD = /^(?:on|for|at|to|of|in|the|a|an|my|our|some|from|with|via|using|by|towards|toward|and|&|-|–|:|,|\.)\s+/i;
const FILLER_TRAIL = /\s+(?:on|for|at|to|of|in|the|a|an|my|from|with|via|using|by|and|&|-|–|:|,)$/i;
const FILLER_ONLY = /^(?:on|for|at|to|of|in|the|a|an|my|our|from|with|via|by|and|i|it|rs|me|we|us)$/i;
function cleanNote(s) {
  let t = ' ' + s + ' ';
  t = t.replace(/#[A-Za-z0-9_-]+/g, ' ');
  t = t.replace(/[₹$€£¥]/g, ' ');
  t = t.replace(/(^|\s)(?:rs\.?|inr|rupees?|bucks|dollars?|usd|euros?|pounds?|gbp|only|amount|total)(?=[\s,.;:]|$)/gi, ' ');
  t = t.replace(/\b(?:i've|ive|i have|i had|i|have|had|just|spent|spend|spending|paid|pay|paying|payed|bought|buy|buying|purchased|purchase|ordered|got|gave|give|sent|received|receive|recieved|credited|debited|earned|added|add|was|were|is|for a total of)\b/gi, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  let prev;
  do { prev = t; t = t.replace(FILLER_LEAD, '').replace(FILLER_TRAIL, '').trim(); } while (t !== prev);
  t = t.replace(/^[\s,.;:–\-+]+|[\s,.;:–\-+]+$/g, '').replace(/\(\s*\)/g, '').trim();
  if (FILLER_ONLY.test(t) || /^[\d\s.,§]*$/.test(t)) t = '';
  return cap1(t.replace(/§/g, '').replace(/\s+/g, ' ')).slice(0, 60);
}
function merchantFromNote(note) {
  const m = /\b(?:at|@|from)\s+([A-Za-z0-9][\w&'.\- ]{1,30}?)\s*$/i.exec(note);
  if (!m) return '';
  const name = m[1].trim();
  if (name.split(/\s+/).length > 4 || /^(?:home|work|office|the|a|my|our|there|here)$/i.test(name)) return '';
  return /^[a-z]/.test(name) ? titleCase(name) : name;
}
function removeSpans(s, spans) {
  const arr = s.split('');
  for (const sp of spans) for (let i = sp.start; i < sp.end && i < arr.length; i++) arr[i] = ' ';
  return arr.join('');
}

/* ---------- whose money: a household member, or shared ---------- */
function detectWho(s, ctx) {
  const members = (ctx && ctx.members) || [];
  const lc = s.toLowerCase();
  const spans = [];
  let who = '';
  for (const m of members) {
    const names = [m.name].concat(m.aliases || []).map(n => String(n || '').trim().toLowerCase()).filter(n => n.length >= 2 && !/^(?:me|you|person \d)$/.test(n));
    for (const n of names) {
      const re = new RegExp("(?:\\b(?:paid by|spent by|for|by|from)\\s+)?\\b" + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "(?:'s|s')?\\b");
      const hit = re.exec(lc);
      if (!hit) continue;
      who = !who || who === m.id ? m.id : 'joint';
      spans.push({ start: hit.index, end: hit.index + hit[0].length });
      break;
    }
  }
  if (!who) {
    const j = /\b(?:shared|joint|together|both of us|for both|for us|household|split)\b/.exec(lc);
    if (j) { who = 'joint'; spans.push({ start: j.index, end: j.index + j[0].length }); }
    else if (/\b(?:our|we|us)\b/.test(lc)) who = 'joint';
  }
  return who ? { who, spans } : null;
}

/* ---------- budget commands ---------- */
function parseBudgetCommand(text, ctx) {
  const t = text.trim().replace(/[.!]$/, '');
  if (!/\bbudget\b/i.test(t)) return null;
  const AMT = '(.+)';
  let m, catText = null, amtText = null;
  if ((m = new RegExp('^(?:set\\s+)?(?:my\\s+|the\\s+)?(?:monthly\\s+|overall\\s+|total\\s+|month\\s+)?budget\\s*(?:to|=|:|of|is|at|as)?\\s*' + AMT + '$', 'i').exec(t)) && /^\s*(?:[₹$€£]|rs\.?)?\s*\d/i.test(m[1])) { catText = ''; amtText = m[1]; }
  else if ((m = new RegExp('^(?:set\\s+)?budget\\s+(?:for|of|on)\\s+(.+?)\\s*(?:to|=|:|is|at|as)?\\s*((?:[₹$€£]|rs\\.?)?\\s*\\d.*)$', 'i').exec(t))) { catText = m[1]; amtText = m[2]; }
  else if ((m = new RegExp('^(?:set\\s+)?(?:my\\s+|the\\s+|a\\s+)?(.+?)\\s+budget\\s*(?:to|=|:|is|at|as|of)?\\s*((?:[₹$€£]|rs\\.?)?\\s*\\d.*)$', 'i').exec(t))) { catText = m[1]; amtText = m[2]; }
  else if ((m = new RegExp('^(?:set\\s+)?budget\\s+([a-z][a-z &]+?)\\s*(?:to|=|:|is|at|as)?\\s*((?:[₹$€£]|rs\\.?)?\\s*\\d.*)$', 'i').exec(t))) {
    // "budget food 8000" only when the words name a category, so "budget hotel 2500" stays an expense
    const words = normText(m[1]).trim();
    const named = (ctx.cats || DEFAULT_CATS).find(c => !c.hidden && c.type === 'expense' && (c.id === words || normText(c.name).trim() === words || normText(c.name).trim().split(' ')[0] === words.replace(/s$/, '') || normText(c.name).trim().split(' ')[0] === words));
    if (!named) return null;
    catText = named.name; amtText = m[2];
  }
  if (amtText == null) return null;
  const cands = findAmounts(maskText(amtText));
  const best = pickAmount(cands);
  if (!best) return null;
  if (/^(?:monthly|overall|total|month|my|the)$/i.test(catText.trim())) catText = '';
  let cat = null;
  if (catText) {
    const r = catFromText(catText, 'expense', ctx);
    if (r.source === 'default') return { kind: 'budget', cat: null, amount: best.val, unknown: catText };
    cat = r.cat;
  }
  return { kind: 'budget', cat, amount: best.val };
}

/* ---------- segments ---------- */
function hasAmount(text) { return findAmounts(maskText(text)).some(c => c.score > -3); }
function segmentText(text) {
  const parts = [];
  const re = /\n+|;|,(?!\d{2,3}\b)|\s+(?:and|&|plus|also|then|aur)\s+|\s\+\s/gi;
  let last = 0, m;
  while ((m = re.exec(text))) { parts.push({ text: text.slice(last, m.index), sep: m[0] }); last = m.index + m[0].length; }
  parts.push({ text: text.slice(last), sep: '' });
  const segs = parts.filter(p => p.text.trim()).map(p => ({ text: p.text, sep: p.sep, amt: hasAmount(p.text) }));
  const out = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (s.amt) { out.push({ text: s.text, sep: s.sep }); continue; }
    if (out.length) { const p = out[out.length - 1]; p.text = p.text + p.sep + s.text; p.sep = s.sep; }
    else if (i + 1 < segs.length) segs[i + 1] = { text: s.text + s.sep + segs[i + 1].text, sep: segs[i + 1].sep, amt: segs[i + 1].amt };
    else out.push({ text: s.text, sep: s.sep });
  }
  // a segment holding two or more currency-marked amounts becomes one entry per amount
  const final = [];
  for (const o of out) {
    const masked = maskText(o.text);
    const strong = findAmounts(masked).filter(c => c.hasCur && c.score >= 5 && !c.product).sort((a, b) => a.start - b.start);
    if (strong.length < 2) { final.push(o.text.trim()); continue; }
    const leadsWithAmount = !/[a-z]/i.test(o.text.slice(0, strong[0].start));
    let cut = 0;
    for (let i = 1; i < strong.length; i++) {
      const at = leadsWithAmount ? strong[i].start : strong[i - 1].end;
      final.push(o.text.slice(cut, at).trim()); cut = at;
    }
    final.push(o.text.slice(cut).trim());
  }
  return final.filter(Boolean);
}

/* ---------- one segment ---------- */
function parseSegment(seg, ctx) {
  const masked = maskText(seg);
  const cands = findAmounts(masked);
  const best = pickAmount(cands);
  const spans = [];
  if (best) spans.push(best);
  const d = detectDate(masked, ctx);
  if (d) spans.push(d);
  const meth = detectMethod(masked);
  if (meth) spans.push(meth);
  const rep = detectRepeat(masked);
  if (rep) spans.push(rep);
  const wh = detectWho(seg, ctx);
  if (wh) for (const sp of wh.spans) spans.push(sp);
  const tags = [];
  seg.replace(/#([A-Za-z0-9_-]+)/g, (m, t) => { if (tags.length < 8 && tags.indexOf(t.toLowerCase()) < 0) tags.push(t.toLowerCase()); return m; });
  const lc = masked.toLowerCase();
  const typeInfo = detectType(lc, best ? best.sign : '');
  const textForCat = removeSpans(seg, (best ? [best] : []).concat(wh ? wh.spans : []));
  const c = categorize(textForCat, typeInfo, ctx);
  const rest = removeSpans(seg, spans);
  let note = cleanNote(rest);
  const tail = rest.replace(/#[A-Za-z0-9_-]+/g, ' ').replace(/[\s,.;:–-]+$/, '').replace(/\s+(?:on|for|to|of|in|with|via|by)\s*$/i, '');
  const merchant = c.brand || merchantFromNote(tail);
  const catObj = (ctx.cats || DEFAULT_CATS).find(x => x.id === c.cat);
  if (!note) note = merchant || (catObj ? catObj.name : 'Entry');
  if (c.type === 'income' && !c.brand && merchant && note.toLowerCase() === merchant.toLowerCase()) note = 'From ' + merchant;
  const good = cands.filter(x => x.score > -3 && !x.product && x.val >= 1);
  let conf = best ? 1 : 0;
  if (c.source === 'default') conf -= 0.45;
  else if (c.source === 'keyword' && c.score <= 1) conf -= 0.25;
  if (good.length >= 2 && !(best && best.product) && !(best && best.hasCur && good.filter(x => x.hasCur).length === 1)) conf -= 0.3;
  if (seg.length > 80) conf -= 0.2;
  return {
    type: c.type, amount: best ? best.val : 0, cat: c.cat, catSource: c.source,
    date: d ? d.date : ((ctx && ctx.today) || todayStr()), dateExplicit: !!d,
    note, merchant, method: meth ? meth.method : '', repeat: rep ? rep.repeat : '', tags, who: wh ? wh.who : '',
    conf: Math.max(0, conf), raw: seg.trim()
  };
}

/* ---------- bank SMS / e-mail alerts ---------- */
const BANK_HINT = /(?:\ba\/c\b|\bacct\b|\baccount\b|\bavl\.?\s*bal|available\s+balance|\bupi\s*ref|\bref\s*no|\btxn\b|\bvpa\b|\bneft\b|\bimps\b|\brtgs\b|card\s+(?:ending|no\.?|xx)|\bxx\d{2,}|\*\d{4}\b|transaction\s+with|was\s+charged|@ok\w+|@ybl|@paytm|@upi)/i;
const BANK_VERB = /(?:debited|credited|spent|paid|sent|received|withdrawn|charged|transaction|purchase|deposited|refund)/i;
function looksLikeBankMessage(s) { return BANK_HINT.test(s) && /\d/.test(s) && BANK_VERB.test(s); }
function splitMessages(text) {
  const blocks = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  if (blocks.length > 1) return blocks;
  const lines = text.split(/\n/).map(s => s.trim()).filter(Boolean);
  if (lines.length <= 1) return lines;
  const msgs = [];
  for (const l of lines) {
    if (msgs.length && !(/\d/.test(l) && BANK_VERB.test(l))) msgs[msgs.length - 1] += ' ' + l;
    else msgs.push(l);
  }
  return msgs;
}
function vpaName(v) {
  const p = String(v).split(/[.\-_]/).filter(x => /^[a-z]{3,}$/i.test(x));
  if (!p.length) return '';
  const w = p[0].toLowerCase();
  if (/^(?:paytmqr|bharatpe|upi|pay|merchant|ibz|q\d)$/.test(w)) return p[1] ? titleCase(p[1]) : '';
  return titleCase(w);
}
function cleanMerchant(s) {
  let t = String(s).replace(/\b(?:a\/c|ac|acct|account|your|vpa|upi|ref.*|on\s.*|xx+\d*|\*+\d*|neft|imps|rtgs|ach|nach|pos|ecom|the)\b/gi, ' ')
    .replace(/[^A-Za-z0-9&'.\- ]/g, ' ').replace(/\b\d{3,}\b/g, ' ').replace(/\s+/g, ' ').trim();
  t = t.replace(/^[.\-' ]+|[.\-' ]+$/g, '');
  if (!t || t.length < 2 || /^(?:rs|inr|usd|bank|card|credit|debit|a|an|is|has|was|by|from|to|with|of|for)$/i.test(t)) return '';
  if (t === t.toUpperCase()) t = titleCase(t);
  return t.slice(0, 40);
}
function parseBankMessage(msg, ctx) {
  const t = msg.replace(/\s+/g, ' ').trim();
  if (/\b(?:otp|one[- ]time password|verification code)\b/i.test(t) && !/\b(?:debited|credited)\b/i.test(t)) return null;
  const AM = /(?:rs\.?|inr|₹|usd|\$|eur|€|gbp|£|aed|sgd|cad|aud)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)(?![a-z])/gi;
  let amount = 0, am;
  while ((am = AM.exec(t))) {
    const before = t.slice(Math.max(0, am.index - 28), am.index).toLowerCase();
    if (/(?:bal(?:ance)?|limit|lmt|avl|available|outstanding|due|min(?:imum)?\.?\s*(?:amt|amount)?)[\s:.\-]*(?:is|of)?[\s:.\-]*$/.test(before)) continue;
    amount = round2(parseFloat((am[1] || am[2]).replace(/,/g, '')));
    if (amount > 0) break;
  }
  if (!amount) {
    const best = pickAmount(findAmounts(maskText(t)).filter(c => c.score > -3));
    if (!best) return null;
    amount = best.val;
  }
  const lc = t.toLowerCase();
  const di = lc.search(/\b(?:debited|debit(?:ed)?\s+(?:by|with|for)|spent|sent|paid|charged|withdrawn|withdrawal|purchase|purchased|transaction\s+(?:of|at|with)|made\s+a|txn\s+(?:of|at)|dr\b)/);
  const ci = lc.search(/\b(?:credited|received|deposited|refund(?:ed)?|reversal|reversed|cashback|cr\b)/);
  const type = di >= 0 && (ci < 0 || di <= ci) ? 'expense' : (ci >= 0 ? 'income' : 'expense');
  let merchant = '', mm;
  if ((mm = /\bvpa\s*:?\s*([a-z0-9.\-_]+)@[a-z0-9.\-]+/i.exec(t)) || (mm = /\b([a-z][a-z0-9.\-_]{2,})@(?:ok\w+|ybl|ibl|axl|paytm|upi|apl|icici|hdfcbank|sbi|axisbank|kotak|yesbank|pt\w+|airtel|jio|fbl|idfcbank|rbl|indus|freecharge|mobikwik|wa\w+|abfspay|ikwik|naviaxis|superyes|axisb|hdfc)\b/i.exec(t))) merchant = vpaName(mm[1]);
  if (!merchant) {
    const re = /\b(?:at|to|towards|trf to|transfer to|paid to|sent to|with|info:?)\s+([a-z][a-z0-9&'.\- ]{1,40}?)(?=\s+(?:on|ref|upi|avl|bal|via|from|using|txn|dated|is|has|was|for)\b|\s*[.,;(]|\s*$)/gi;
    while ((mm = re.exec(t))) { const c = cleanMerchant(mm[1]); if (c && !/^(?:your|rs|inr)\b/i.test(mm[1])) { merchant = c; break; } }
  }
  if (!merchant && type === 'income') {
    const re = /\b(?:from|by)\s+([a-z][a-z0-9&'.\- ]{1,40}?)(?=\s+(?:on|ref|upi|avl|bal|via|txn|dated|is|has|was|for)\b|\s*[.,;(]|\s*$)/gi;
    while ((mm = re.exec(t))) { const c = cleanMerchant(mm[1]); if (c && !/^(?:your|a\/c|account)\b/i.test(mm[1])) { merchant = c; break; } }
  }
  if (!merchant && (mm = /\bupi[/\-](?:p2[mp][/\-])?(?:\d+[/\-])?([a-z][a-z0-9 .&']{2,30})/i.exec(t))) merchant = cleanMerchant(mm[1]);
  const d = detectDate(maskText(t), ctx);
  let method = '';
  if (/\bupi\b|\bvpa\b|@ok|@ybl|@paytm/i.test(t)) method = 'UPI';
  else if (/credit\s*card|\bcc\b/i.test(t)) method = 'Credit Card';
  else if (/debit\s*card|\bcard\b|\bpos\b/i.test(t)) method = 'Card';
  else if (/\b(?:neft|imps|rtgs|ach|nach)\b/i.test(t)) method = 'Bank Transfer';
  let c;
  if (/\batm\b|cash\s+withdrawal|withdrawn\s+at/i.test(t) && type === 'expense') c = { type, cat: 'transfer', source: 'keyword', brand: '' };
  else if (/(?:payment|paid)\s+(?:received\s+)?(?:towards|for|to)\s+(?:your\s+)?(?:\w+\s+)?credit\s*card|credit\s*card\s+(?:bill|payment)/i.test(t)) c = { type, cat: 'transfer', source: 'keyword', brand: '' };
  else if (type === 'income' && /\b(?:salary|sal|payroll|wages)\b/i.test(t)) c = { type, cat: 'salary', source: 'keyword', brand: '' };
  else {
    c = merchant ? categorize(merchant, { type, strong: true }, ctx) : null;
    if (!c || c.source === 'default') c = categorize(t.replace(/\b(?:a\/c|account|card|bank|credit|debit)\b/gi, ' '), { type, strong: true }, ctx);
  }
  return {
    type, amount, cat: c.cat, catSource: c.source, date: d ? d.date : ((ctx && ctx.today) || todayStr()), dateExplicit: !!d,
    note: merchant || (c.brand || (type === 'income' ? 'Bank credit' : 'Bank debit')), merchant: merchant || c.brand || '', method, repeat: '', tags: [],
    conf: merchant ? 0.85 : 0.6, raw: t
  };
}
function parseBankMessages(text, ctx) { return splitMessages(text).map(m => parseBankMessage(m, ctx)).filter(Boolean); }

/* ---------- entry point ---------- */
function parseText(input, ctx) {
  ctx = ctx || {};
  const raw = String(input || '').trim();
  if (!raw) return { kind: 'empty', entries: [], needsAI: false };
  if (looksLikeBankMessage(raw)) {
    const e = parseBankMessages(raw, ctx);
    if (e.length) return { kind: 'entries', entries: e, source: 'sms', needsAI: e.some(x => x.conf < 0.6) };
  }
  const text = normalizeSpoken(raw);
  const cmd = parseBudgetCommand(text, ctx);
  if (cmd) return { kind: 'command', command: cmd, entries: [], needsAI: false };
  const entries = segmentText(text).map(s => parseSegment(s, ctx));
  const withDate = entries.find(e => e.dateExplicit);
  const withMethod = entries.find(e => e.method);
  // "shared: dinner 450 and movie 500" makes both shared; a later "shared groceries" never reaches back
  const jointLead = entries.length > 1 && entries[0].who === 'joint';
  for (const e of entries) {
    if (!e.who && jointLead) e.who = 'joint';
    if (!e.dateExplicit && withDate) e.date = withDate.date;
    if (!e.method && withMethod && entries.length > 1) e.method = withMethod.method;
  }
  const needsAI = !entries.length || entries.some(e => e.conf < 0.6) || raw.length > 140;
  return { kind: 'entries', entries, needsAI };
}

/* ---------- AI answers → drafts ---------- */
function resolveCat(v, type, cats) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return '';
  let c = cats.find(x => x.id === s) || cats.find(x => x.name.toLowerCase() === s) || cats.find(x => normText(x.name).trim() === normText(s).trim());
  if (!c) c = cats.find(x => x.type === type && (x.name.toLowerCase().indexOf(s) >= 0 || s.indexOf(x.name.toLowerCase().split(' ')[0]) >= 0));
  return c && !c.hidden ? c.id : '';
}
function draftsFromAI(obj, ctx) {
  const cats = ctx.cats || DEFAULT_CATS;
  const list = Array.isArray(obj) ? obj : (obj && Array.isArray(obj.entries) ? obj.entries : []);
  const out = [];
  for (const it of list.slice(0, 25)) {
    if (!it || typeof it !== 'object') continue;
    const amount = round2(Math.abs(parseFloat(String(it.amount).replace(/[^\d.\-]/g, ''))));
    if (!(amount > 0)) continue;
    let type = String(it.type).toLowerCase() === 'income' ? 'income' : 'expense';
    let cat = resolveCat(it.category, type, cats);
    if (!cat) cat = catFromText(String(it.note || '') + ' ' + String(it.merchant || ''), type, ctx).cat;
    const co = cats.find(c => c.id === cat);
    if (co && co.type !== type) type = co.type;
    const method = METHODS.find(x => x.toLowerCase() === String(it.method || '').trim().toLowerCase()) || '';
    const rep = String(it.repeat || '').toLowerCase();
    const merchant = String(it.merchant || '').trim().slice(0, 40);
    out.push({
      type, amount, cat, catSource: 'ai', date: isYMD(it.date) ? it.date : ((ctx && ctx.today) || todayStr()), dateExplicit: isYMD(it.date),
      note: cap1(String(it.note || '').trim()).slice(0, 60) || merchant || (co ? co.name : 'Entry'), merchant,
      method, repeat: ['weekly', 'monthly', 'yearly'].indexOf(rep) >= 0 ? rep : '', tags: [], conf: 0.9, raw: ''
    });
  }
  return out;
}

/* ---------- CSV statements ---------- */
function parseCSV(text) {
  text = String(text || '').replace(/^\uFEFF/, '');
  const head = text.split(/\r?\n/).slice(0, 8).join('\n');
  let delim = ',', bestN = -1;
  for (const d of [',', ';', '\t', '|']) { const n = head.split(d).length; if (n > bestN) { bestN = n; delim = d; } }
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += ch;
    } else if (ch === '"' && field.trim() === '') { q = true; field = ''; }
    else if (ch === delim) { row.push(field.trim()); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(field.trim()); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field !== '' || row.length) { row.push(field.trim()); rows.push(row); }
  return rows.filter(r => r.some(f => f !== ''));
}
const COL_PATTERNS = {
  balance: /balance|\bbal\b/i,
  date: /date|^posted|^when$|^time$/i,
  desc: /desc|narration|details|particular|merchant|payee|remark|memo|^name$|counterparty|^transaction$|^reference$|^info|^notes?$|^title$/i,
  debit: /debit|withdraw|paid\s*out|money\s*out|^dr\.?$|outflow|^expense|spent/i,
  credit: /credit|deposit|paid\s*in|money\s*in|^cr\.?$|inflow|^income|received/i,
  amount: /amount|^amt|^value$|^sum$|^total$/i,
  type: /^type$|dr\s*\/\s*cr|cr\s*\/\s*dr|^debit\s*\/\s*credit$|transaction type|^direction$/i,
  category: /categor/i,
  method: /method|^mode|payment type|channel/i
};
function mapColumns(header) {
  const map = {};
  const used = new Set();
  const order = ['balance', 'type', 'date', 'category', 'method', 'debit', 'credit', 'amount', 'desc'];
  for (const key of order) {
    for (let i = 0; i < header.length; i++) {
      if (used.has(i)) continue;
      if (COL_PATTERNS[key].test(header[i])) { map[key] = i; used.add(i); break; }
    }
  }
  return map;
}
function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const m = mapColumns(rows[i]);
    if (m.date != null && (m.amount != null || m.debit != null || m.credit != null)) return i;
  }
  return -1;
}
function parseMoneyCell(s) {
  let t = String(s || '').trim();
  if (!t) return NaN;
  let neg = /^\(.*\)$/.test(t) || /^-|^−|-\s*$/.test(t) || /\bdr\.?$/i.test(t);
  t = t.replace(/[^\d.,]/g, '');
  if (/\d\.\d{3},\d{1,2}$/.test(t) || /^\d+,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else t = t.replace(/,/g, '');
  const v = parseFloat(t);
  return Number.isFinite(v) ? (neg ? -v : v) : NaN;
}
function parseLooseDate(s, order) {
  const t = String(s || '').trim();
  let m;
  if ((m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(t))) return mkDate(+m[1], +m[2], +m[3]);
  if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(t))) {
    const a = +m[1], b = +m[2], y = fixYear(m[3]);
    if (a > 12) return mkDate(y, b, a);
    if (b > 12) return mkDate(y, a, b);
    return order === 'MDY' ? mkDate(y, a, b) : mkDate(y, b, a);
  }
  if ((m = /^(\d{1,2})[\s\-/]*([a-z]{3,9})\.?[\s\-/,]*(\d{2,4})/i.exec(t))) { const mo = monthNum(m[2]); if (mo) return mkDate(fixYear(m[3]), mo, +m[1]); }
  if ((m = /^([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/i.exec(t))) { const mo = monthNum(m[1]); if (mo) return mkDate(+m[3], mo, +m[2]); }
  if ((m = /^(\d{5})(?:\.\d+)?$/.exec(t))) { const d = new Date(1899, 11, 30); d.setDate(d.getDate() + +m[1]); return ymd(d); }
  return null;
}
function detectDateOrder(cells, fallback) {
  for (const c of cells) {
    const m = /^(\d{1,2})[-/.](\d{1,2})[-/.]\d{2,4}/.exec(String(c || '').trim());
    if (!m) continue;
    if (+m[1] > 12) return 'DMY';
    if (+m[2] > 12) return 'MDY';
  }
  return fallback || 'DMY';
}
function cleanDescription(s) {
  let t = String(s || '').replace(/\s+/g, ' ').trim();
  const vm = /([a-z][a-z0-9.\-_]{2,})@[a-z]{2,}/i.exec(t);
  if (vm) { const v = vpaName(vm[1]); if (v) return v; }
  const um = /\bupi[/\-](?:p2[mp][/\-])?(?:\d+[/\-])?([a-z][a-z0-9 .&']{2,30})/i.exec(t);
  if (um) { const c = cleanMerchant(um[1].split(/[/\-]/)[0]); if (c) return c; }
  t = t.replace(/^(?:pos|ecom|neft|imps|rtgs|ach|nach|upi|debit card purchase|card purchase|purchase|payment to|payment|online payment|direct debit|dd|bill pay(?:ment)?|transfer to|trf to|to transfer|by transfer)[\s:/\-]+/i, '');
  t = t.replace(/\b\d{6,}\b/g, ' ').replace(/[*#]+\d*/g, ' ').replace(/\s+/g, ' ').trim();
  if (t === t.toUpperCase()) t = titleCase(t);
  return t.slice(0, 50) || 'Statement entry';
}
function csvToDrafts(rows, ctx, opts) {
  opts = opts || {};
  const hi = findHeaderRow(rows);
  if (hi < 0) return { error: 'I could not find the header row. The file needs columns for a date and an amount (or debit and credit).', drafts: [] };
  const header = rows[hi];
  const col = Object.assign(mapColumns(header), opts.map || {});
  const body = rows.slice(hi + 1).filter(r => r.length >= 2);
  const order = detectDateOrder(body.map(r => r[col.date]), (ctx && ctx.dateOrder) || 'DMY');
  let positives = 0, signed = 0;
  if (col.amount != null && col.debit == null && col.credit == null) {
    for (const r of body) { const v = parseMoneyCell(r[col.amount]); if (Number.isFinite(v)) { signed++; if (v > 0) positives++; } }
  }
  const positiveIsExpense = opts.positiveIsExpense != null ? opts.positiveIsExpense : (signed > 0 && positives / signed > 0.8 && col.type == null);
  const drafts = [];
  let skipped = 0;
  for (const r of body) {
    const date = parseLooseDate(r[col.date], order);
    if (!date) { skipped++; continue; }
    let amount = NaN, type = 'expense';
    if (col.debit != null || col.credit != null) {
      const dv = col.debit != null ? parseMoneyCell(r[col.debit]) : NaN;
      const cv = col.credit != null ? parseMoneyCell(r[col.credit]) : NaN;
      if (Number.isFinite(dv) && Math.abs(dv) > 0) { amount = Math.abs(dv); type = 'expense'; }
      else if (Number.isFinite(cv) && Math.abs(cv) > 0) { amount = Math.abs(cv); type = 'income'; }
      else if (col.amount != null) { const v = parseMoneyCell(r[col.amount]); if (Number.isFinite(v)) { amount = Math.abs(v); type = v < 0 ? 'expense' : 'income'; } }
    } else if (col.amount != null) {
      const v = parseMoneyCell(r[col.amount]);
      if (Number.isFinite(v)) {
        amount = Math.abs(v);
        type = positiveIsExpense ? (v > 0 ? 'expense' : 'income') : (v < 0 ? 'expense' : 'income');
      }
    }
    if (col.type != null) {
      const tv = String(r[col.type] || '').toLowerCase();
      if (/^(?:dr|debit|d|withdrawal|expense|out)/.test(tv)) type = 'expense';
      else if (/^(?:cr|credit|c|deposit|income|in)/.test(tv)) type = 'income';
    }
    if (!(amount > 0)) { skipped++; continue; }
    const rawDesc = col.desc != null ? r[col.desc] : '';
    const note = cleanDescription(rawDesc);
    let cat = '';
    if (col.category != null && r[col.category]) cat = resolveCat(r[col.category], type, (ctx && ctx.cats) || DEFAULT_CATS);
    let c = null;
    if (!cat) { c = categorize(note + ' ' + rawDesc, { type, strong: true }, ctx); cat = c.cat; }
    const co = ((ctx && ctx.cats) || DEFAULT_CATS).find(x => x.id === cat);
    let method = '';
    const mv = (col.method != null ? r[col.method] + ' ' : '') + rawDesc;
    if (/\bupi\b|@/i.test(mv)) method = 'UPI';
    else if (/credit\s*card/i.test(mv)) method = 'Credit Card';
    else if (/\bpos\b|card/i.test(mv)) method = 'Card';
    else if (/\b(?:neft|imps|rtgs|ach|transfer)\b/i.test(mv)) method = 'Bank Transfer';
    else if (/\bcash\b|\batm\b/i.test(mv)) method = 'Cash';
    drafts.push({
      type: co ? co.type : type, amount: round2(amount), cat, catSource: c ? c.source : 'csv', date, dateExplicit: true,
      note, merchant: c && c.brand ? c.brand : '', method, repeat: '', tags: [], conf: c && c.source === 'default' ? 0.5 : 0.85, raw: String(rawDesc || '')
    });
  }
  return { drafts, skipped, header, map: col, positiveIsExpense, order };
}
