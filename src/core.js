/* ===================== core: dates, money, categories ===================== */

const pad2 = n => String(n).padStart(2, '0');
function ymd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function parseYMD(s) { const p = String(s).split('-').map(Number); return new Date(p[0], (p[1] || 1) - 1, p[2] || 1); }
function isYMD(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && ymd(parseYMD(s)) === s; }
function todayStr() { return ymd(new Date()); }
function addDays(s, n) { const d = parseYMD(s); d.setDate(d.getDate() + n); return ymd(d); }
function daysBetween(a, b) { return Math.round((parseYMD(b) - parseYMD(a)) / 864e5); }
function daysInMonth(y, m0) { return new Date(y, m0 + 1, 0).getDate(); }
function monthOf(s) { return String(s).slice(0, 7); }
function addMonths(s, n, anchorDay) {
  const d = parseYMD(s);
  let y = d.getFullYear(), m = d.getMonth() + n;
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  return ymd(new Date(y, m, Math.min(anchorDay || d.getDate(), daysInMonth(y, m))));
}
function shiftKey(key, n) {
  let [y, m] = key.split('-').map(Number);
  m += n;
  while (m > 12) { m -= 12; y++; }
  while (m < 1) { m += 12; y--; }
  return y + '-' + pad2(m);
}
/* A budget period starts on `sd` (1-28) and runs to the day before the next start. Key = month it starts in. */
function periodFromKey(key, sd) {
  const [y, m] = key.split('-').map(Number);
  const start = ymd(new Date(y, m - 1, Math.min(sd, daysInMonth(y, m - 1))));
  const [ny, nm] = shiftKey(key, 1).split('-').map(Number);
  const end = addDays(ymd(new Date(ny, nm - 1, Math.min(sd, daysInMonth(ny, nm - 1)))), -1);
  return { key, start, end, days: daysBetween(start, end) + 1 };
}
function periodKeyFor(dateStr, sd) {
  const d = parseYMD(dateStr);
  let y = d.getFullYear(), m = d.getMonth() + 1;
  if (d.getDate() < sd) { m--; if (m < 1) { m = 12; y--; } }
  return y + '-' + pad2(m);
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function uid(p) { return (p || 't') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
const round2 = n => Math.round((+n || 0) * 100) / 100;
const sum = (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0);
function median(a) { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function titleCase(s) { return String(s).toLowerCase().replace(/(^|[\s(/&-])([a-z])/g, (m, a, b) => a + b.toUpperCase()); }
function cap1(s) { s = String(s || '').trim(); return s ? s[0].toUpperCase() + s.slice(1) : s; }

/* ---------- locale + money ---------- */
const TZ_CUR = {
  'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR', 'Asia/Karachi': 'PKR', 'Asia/Dhaka': 'BDT', 'Asia/Colombo': 'LKR',
  'Asia/Kathmandu': 'NPR', 'Asia/Katmandu': 'NPR', 'Asia/Dubai': 'AED', 'Asia/Muscat': 'OMR', 'Asia/Riyadh': 'SAR',
  'Asia/Qatar': 'QAR', 'Asia/Kuwait': 'KWD', 'Asia/Bahrain': 'BHD', 'Asia/Singapore': 'SGD', 'Asia/Kuala_Lumpur': 'MYR',
  'Asia/Jakarta': 'IDR', 'Asia/Manila': 'PHP', 'Asia/Bangkok': 'THB', 'Asia/Ho_Chi_Minh': 'VND', 'Asia/Saigon': 'VND',
  'Asia/Tokyo': 'JPY', 'Asia/Seoul': 'KRW', 'Asia/Shanghai': 'CNY', 'Asia/Hong_Kong': 'HKD', 'Asia/Taipei': 'TWD',
  'Asia/Jerusalem': 'ILS', 'Asia/Tel_Aviv': 'ILS', 'Europe/London': 'GBP', 'Europe/Dublin': 'EUR', 'Europe/Zurich': 'CHF',
  'Europe/Stockholm': 'SEK', 'Europe/Oslo': 'NOK', 'Europe/Copenhagen': 'DKK', 'Europe/Warsaw': 'PLN', 'Europe/Prague': 'CZK',
  'Europe/Budapest': 'HUF', 'Europe/Istanbul': 'TRY', 'Europe/Moscow': 'RUB', 'Europe/Kiev': 'UAH', 'Europe/Kyiv': 'UAH',
  'Africa/Lagos': 'NGN', 'Africa/Nairobi': 'KES', 'Africa/Johannesburg': 'ZAR', 'Africa/Cairo': 'EGP',
  'America/Toronto': 'CAD', 'America/Vancouver': 'CAD', 'America/Edmonton': 'CAD', 'America/Winnipeg': 'CAD', 'America/Halifax': 'CAD',
  'America/Mexico_City': 'MXN', 'America/Sao_Paulo': 'BRL', 'America/Argentina/Buenos_Aires': 'ARS', 'America/Bogota': 'COP',
  'America/Santiago': 'CLP', 'America/Lima': 'PEN', 'Australia/Sydney': 'AUD', 'Australia/Melbourne': 'AUD', 'Australia/Brisbane': 'AUD',
  'Australia/Perth': 'AUD', 'Australia/Adelaide': 'AUD', 'Pacific/Auckland': 'NZD'
};
const REGION_CUR = {
  US: 'USD', IN: 'INR', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', SG: 'SGD', AE: 'AED', SA: 'SAR', JP: 'JPY', CN: 'CNY', HK: 'HKD',
  KR: 'KRW', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', ZA: 'ZAR', NG: 'NGN', KE: 'KES', BR: 'BRL', MX: 'MXN',
  PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR', MY: 'MYR', ID: 'IDR', PH: 'PHP', TH: 'THB', VN: 'VND', TR: 'TRY', IL: 'ILS', EG: 'EGP',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR'
};
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'NZD', 'JPY', 'CNY', 'HKD', 'CHF', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR',
  'PKR', 'BDT', 'LKR', 'NPR', 'MYR', 'IDR', 'PHP', 'THB', 'VND', 'KRW', 'TWD', 'ZAR', 'NGN', 'KES', 'EGP', 'BRL', 'MXN', 'ARS', 'COP',
  'CLP', 'PEN', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'TRY', 'ILS', 'RUB', 'UAH'];

function detectLocale() {
  let tz = '', lang = 'en-US';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
  try { lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US'; } catch (e) { /* ignore */ }
  const region = (lang.split('-')[1] || '').toUpperCase();
  let currency = TZ_CUR[tz] || REGION_CUR[region];
  if (!currency) currency = tz.indexOf('Europe/') === 0 ? 'EUR' : 'USD';
  const mdy = region === 'US' || (!region && tz.indexOf('America/') === 0 && currency === 'USD');
  return { currency, dateOrder: mdy ? 'MDY' : 'DMY', lang, decimalComma: /^(de|fr|es|it|pt|nl|pl|tr|ru|sv|da|nb|fi|cs|id)/.test(lang) && currency !== 'INR' };
}
const LOCALE = detectLocale();

const FMT = { cur: LOCALE.currency, nloc: 'en-US', dloc: LOCALE.lang, cache: new Map() };
function setCurrency(cur) {
  FMT.cur = cur || 'USD';
  FMT.nloc = FMT.cur === 'INR' ? 'en-IN' : LOCALE.lang;
  FMT.cache.clear();
}
function fmtCache(key, make) {
  let f = FMT.cache.get(key);
  if (!f) { try { f = make(); } catch (e) { f = null; } FMT.cache.set(key, f); }
  return f;
}
function money(n, opt) {
  opt = opt || {};
  const v = Math.abs(+n || 0);
  const frac = opt.decimals != null ? opt.decimals : (Math.round(v * 100) % 100 === 0 ? 0 : 2);
  const f = fmtCache('m' + frac, () => new Intl.NumberFormat(FMT.nloc, { style: 'currency', currency: FMT.cur, currencyDisplay: 'narrowSymbol', minimumFractionDigits: frac, maximumFractionDigits: frac }))
    || fmtCache('m2' + frac, () => new Intl.NumberFormat(FMT.nloc, { style: 'currency', currency: FMT.cur, minimumFractionDigits: frac, maximumFractionDigits: frac }));
  const s = f ? f.format(v) : FMT.cur + ' ' + v.toFixed(frac);
  if (n < 0) return '−' + s;
  if (opt.sign && n > 0) return '+' + s;
  return s;
}
function moneyR(n) { return money(Math.round(+n || 0)); }
function curSymbol() {
  const f = fmtCache('sym', () => new Intl.NumberFormat(FMT.nloc, { style: 'currency', currency: FMT.cur, currencyDisplay: 'narrowSymbol' }))
    || fmtCache('sym2', () => new Intl.NumberFormat(FMT.nloc, { style: 'currency', currency: FMT.cur }));
  if (!f) return FMT.cur;
  const p = f.formatToParts(0).find(x => x.type === 'currency');
  return p ? p.value : FMT.cur;
}
function compactNum(v) {
  const t = x => (x >= 100 ? String(Math.round(x)) : String(Math.round(x * 10) / 10));
  const t2 = x => (x < 10 ? String(Math.round(x * 100) / 100) : t(x));
  if (FMT.cur === 'INR') {
    if (v >= 1e7) return t2(v / 1e7) + 'Cr';
    if (v >= 1e5) return t2(v / 1e5) + 'L';
  } else {
    if (v >= 1e9) return t2(v / 1e9) + 'B';
    if (v >= 1e6) return t2(v / 1e6) + 'M';
  }
  if (v >= 1e3) return t(v / 1e3) + 'K';
  return String(Math.round(v));
}
function compact(n) { return (n < 0 ? '−' : '') + curSymbol() + compactNum(Math.abs(n)); }
function pct(x, digits) { return (Number.isFinite(x) ? (digits ? (x * 100).toFixed(digits) : Math.round(x * 100)) : 0) + '%'; }
function fmtDate(s, opts) {
  const f = fmtCache('d' + JSON.stringify(opts), () => new Intl.DateTimeFormat(FMT.dloc, opts));
  return f ? f.format(parseYMD(s)) : s;
}
function dayLabel(s) {
  const t = todayStr();
  if (s === t) return 'Today';
  if (s === addDays(t, -1)) return 'Yesterday';
  if (s === addDays(t, 1)) return 'Tomorrow';
  const sameYear = s.slice(0, 4) === t.slice(0, 4);
  return fmtDate(s, sameYear ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}
function shortDate(s) { return fmtDate(s, { day: 'numeric', month: 'short' }); }

/* ---------- categories ---------- */
const DEFAULT_CATS = [
  { id: 'food', name: 'Food & Dining', emoji: '🍽️', type: 'expense', group: 'wants' },
  { id: 'groceries', name: 'Groceries', emoji: '🛒', type: 'expense', group: 'needs' },
  { id: 'transport', name: 'Transport & Fuel', emoji: '🚕', type: 'expense', group: 'needs' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', type: 'expense', group: 'wants' },
  { id: 'bills', name: 'Bills & Utilities', emoji: '💡', type: 'expense', group: 'needs' },
  { id: 'home', name: 'Rent & Home', emoji: '🏠', type: 'expense', group: 'needs' },
  { id: 'sendhome', name: 'Sending home', emoji: '🏡', type: 'expense', group: 'needs' },
  { id: 'health', name: 'Health & Fitness', emoji: '💊', type: 'expense', group: 'needs' },
  { id: 'fun', name: 'Entertainment', emoji: '🎬', type: 'expense', group: 'wants' },
  { id: 'subs', name: 'Subscriptions', emoji: '🔁', type: 'expense', group: 'wants' },
  { id: 'travel', name: 'Travel', emoji: '✈️', type: 'expense', group: 'wants' },
  { id: 'edu', name: 'Education', emoji: '📚', type: 'expense', group: 'needs' },
  { id: 'care', name: 'Personal Care', emoji: '💇', type: 'expense', group: 'wants' },
  { id: 'family', name: 'Family & Kids', emoji: '🧸', type: 'expense', group: 'needs' },
  { id: 'gifts', name: 'Gifts & Donations', emoji: '🎁', type: 'expense', group: 'wants' },
  { id: 'emi', name: 'Loans & EMI', emoji: '🏦', type: 'expense', group: 'needs' },
  { id: 'insurance', name: 'Insurance', emoji: '🛡️', type: 'expense', group: 'needs' },
  { id: 'fees', name: 'Taxes & Fees', emoji: '🧾', type: 'expense', group: 'needs' },
  { id: 'invest', name: 'Savings & Investments', emoji: '📈', type: 'expense', group: 'savings' },
  { id: 'transfer', name: 'Card Bills & Transfers', emoji: '🔄', type: 'expense', group: 'transfer' },
  { id: 'other', name: 'Other', emoji: '📦', type: 'expense', group: 'wants' },
  { id: 'salary', name: 'Salary', emoji: '💼', type: 'income', group: 'income' },
  { id: 'bonus', name: 'Bonus & Incentives', emoji: '🎉', type: 'income', group: 'income' },
  { id: 'business', name: 'Business & Freelance', emoji: '💻', type: 'income', group: 'income' },
  { id: 'returns', name: 'Interest & Dividends', emoji: '🌱', type: 'income', group: 'income' },
  { id: 'rental', name: 'Rental Income', emoji: '🏘️', type: 'income', group: 'income' },
  { id: 'refund', name: 'Refunds & Cashback', emoji: '↩️', type: 'income', group: 'income' },
  { id: 'gift_in', name: 'Gifts Received', emoji: '🎀', type: 'income', group: 'income' },
  { id: 'other_in', name: 'Other Income', emoji: '💰', type: 'income', group: 'income' }
];
const GROUP_LABEL = { needs: 'Needs', wants: 'Wants', savings: 'Saving & investing', transfer: 'Not spending (transfers)', income: 'Income' };
const METHODS = ['Cash', 'UPI', 'Card', 'Credit Card', 'Bank Transfer', 'Wallet'];

/* Keyword dictionary. "!Name" = a merchant/brand (strong, also used as the merchant name), "~word" = weak hint. */
const KW = {
  food: ['restaurant', 'restaurants', 'dinner', 'lunch', 'breakfast', 'brunch', 'meal', 'meals', 'food', 'dining', 'fine dining', 'eat out', 'eating out', 'snack', 'snacks', 'cafe', 'café', 'coffee', 'latte', 'cappuccino', 'espresso', 'americano', 'cold coffee', 'tea', 'chai', 'juice', 'smoothie', 'milkshake', 'shake', 'bakery', 'cake', 'pastry', 'pastries', 'dessert', 'desserts', 'ice cream', 'icecream', 'gelato', 'donut', 'doughnut', 'pizza', 'burger', 'burgers', 'sandwich', 'wrap', 'kathi roll', 'biryani', 'dosa', 'idli', 'vada', 'samosa', 'momos', 'momo', 'noodles', 'maggi', 'pasta', 'sushi', 'ramen', 'shawarma', 'kebab', 'kabab', 'thali', 'paratha', 'parotta', 'vada pav', 'pav bhaji', 'chaat', 'pani puri', 'golgappa', 'bhel', 'frankie', 'tiffin', 'canteen', 'mess', 'dhaba', 'takeaway', 'takeout', 'take out', 'food delivery', 'drinks', 'beer', 'beers', 'wine', 'cocktail', 'cocktails', '~bar', 'pub', 'brewery', 'liquor', 'alcohol', 'whisky', 'vodka', 'soda', 'cold drink', 'coke', 'pepsi', 'tip', 'tips',
    '!Swiggy', '!Zomato', '!EatSure', "!Domino's", '!Dominos', '!Pizza Hut', "!McDonald's", '!McDonalds', '!McD', '!KFC', '!Subway', '!Starbucks', '!Café Coffee Day', '!Cafe Coffee Day', '!CCD', '!Chaayos', '!Third Wave Coffee', '!Blue Tokai', "!Haldiram's", '!Haldirams', '!Barbeque Nation', '!Burger King', '!Taco Bell', "!Wendy's", '!Chipotle', '!Panera', '!Dunkin', '!Tim Hortons', '!Costa', '!Pret', '!DoorDash', '!Uber Eats', '!UberEats', '!Grubhub', '!Deliveroo', '!Just Eat', '!foodpanda', '!Talabat', '!Wow Momo', '!Faasos', '!Behrouz', '!Box8', '!Theobroma', '!Baskin Robbins', '!Krispy Kreme', '!Chick-fil-A', '!Five Guys', '!Shake Shack', "!Nando's", '!Greggs', '!Wagamama'],
  groceries: ['grocery', 'groceries', 'supermarket', 'super market', 'vegetables', 'vegetable', 'veggies', 'sabzi', 'sabji', 'fruits', 'fruit', 'milk', 'dairy', 'curd', 'paneer', 'eggs', 'bread', 'butter', 'rice', 'atta', 'flour', 'dal', 'pulses', 'cooking oil', 'ghee', 'sugar', 'salt', 'spices', 'masala', 'kirana', 'provisions', 'ration', 'meat', 'mutton', 'cereal', 'oats', 'household items', 'detergent', 'dishwash', 'tissues', 'toilet paper', 'toilet roll', 'cleaning supplies', 'water can', 'drinking water',
    '!DMart', '!D-Mart', '!D Mart', '!BigBasket', '!Big Basket', '!Blinkit', '!Grofers', '!Zepto', '!Instamart', '!Swiggy Instamart', '!JioMart', '!Reliance Fresh', '!Reliance Smart', '!More Supermarket', "!Spencer's", "!Nature's Basket", '!Star Bazaar', '!Ratnadeep', '!Walmart', '!Costco', '!Kroger', '!Safeway', '!Aldi', '!Lidl', '!Tesco', "!Sainsbury's", '!Asda', '!Morrisons', '!Waitrose', '!Whole Foods', "!Trader Joe's", '!Publix', '!Carrefour', '!Lulu', '!Spinneys', '!Woolworths', '!Coles', '!Instacart', '!Amazon Fresh', '!FreshToHome', '!Licious', '!Country Delight', '!Milkbasket', '!Nilgiris'],
  transport: ['taxi', 'cab', 'cabs', 'auto', 'autorickshaw', 'auto rickshaw', 'rickshaw', 'tuk tuk', 'metro', 'metro card', 'bus', 'bus fare', 'bus pass', 'train', 'local train', 'tram', 'ferry', 'toll', 'tolls', 'fastag', 'parking', 'petrol', 'diesel', 'fuel', 'gas station', 'gasoline', 'cng', 'ev charging', 'charging', '~ride', 'fare', 'commute', 'car wash', 'mechanic', 'puncture', 'tyre', 'tyres', 'tire', 'tires', 'car service', 'bike service', 'car repair', 'bike repair', 'car maintenance', 'bike maintenance', 'servicing', 'oil change', 'driver',
    '!Uber', '!Ola', '!Rapido', '!Lyft', '!Bolt', '!Grab', '!Gojek', '!Careem', '!BluSmart', '!Namma Yatri', '!Shell', '!Chevron', '!Exxon', '!HPCL', '!BPCL', '!IOCL', '!Indian Oil', '!Bharat Petroleum', '!Nayara', '!DMRC', '!BMTC'],
  shopping: ['mall', 'clothes', 'clothing', 'shirt', 'shirts', 't-shirt', 'tshirt', 't shirt', 'jeans', 'trousers', 'pants', 'dress', 'kurta', 'kurti', 'saree', 'sari', 'jacket', 'hoodie', 'shoes', 'shoe', 'sneakers', 'sandals', 'slippers', 'heels', 'bag', 'backpack', 'handbag', 'purse', 'watch', 'jewellery', 'jewelry', 'earrings', 'electronics', 'gadget', 'gadgets', 'mobile phone', 'new phone', 'smartphone', 'iphone', 'laptop', 'tablet', 'ipad', 'headphones', 'earphones', 'earbuds', 'airpods', 'charger', 'cable', 'speaker', 'keyboard', 'mouse', 'monitor', 'tv', 'television', 'camera', 'accessories', 'apparel', 'footwear', 'phone repair', 'laptop repair', 'phone case', '~online order', '~order', '~shopping',
    '!Amazon', '!Flipkart', '!Myntra', '!Ajio', '!Meesho', '!Tata CLiQ', '!Snapdeal', '!Croma', '!Reliance Digital', '!Vijay Sales', '!Decathlon', '!H&M', '!Zara', '!Uniqlo', '!Westside', '!Pantaloons', '!Max Fashion', '!Shoppers Stop', '!Target', '!Best Buy', '!eBay', '!Etsy', '!Shein', '!Temu', '!AliExpress', '!Apple Store', '!Nike', '!Adidas', '!Puma', "!Levi's", '!Marks & Spencer', '!Primark', '!Argos', '!Currys', '!Ikea Store'],
  bills: ['electricity', 'electricity bill', 'electric bill', 'power bill', 'light bill', 'current bill', 'eb bill', 'water bill', 'water tax', 'gas bill', 'lpg', 'cylinder', 'gas cylinder', 'piped gas', 'internet', 'internet bill', 'wifi', 'wi-fi', 'broadband', 'fiber', 'fibre', 'recharge', 'mobile recharge', 'phone recharge', 'prepaid', 'postpaid', 'phone bill', 'mobile bill', 'dth', 'dth recharge', 'tv recharge', 'cable tv', '~utility', '~utilities', '~bill', '~bills',
    '!BESCOM', '!MSEDCL', '!Tata Power', '!Adani Electricity', '!BSES', '!Torrent Power', '!TNEB', '!KSEB', '!CESC', '!Indane', '!HP Gas', '!Bharat Gas', '!Mahanagar Gas', '!IGL', '!ACT Fibernet', '!Hathway', '!Excitel', '!Airtel', '!Jio', '!Vi', '!Vodafone', '!Idea', '!BSNL', '!MTNL', '!Tata Play', '!Tata Sky', '!Dish TV', '!Sun Direct', '!Comcast', '!Xfinity', '!Verizon', '!AT&T', '!T-Mobile', '!Spectrum'],
  home: ['rent', 'house rent', 'flat rent', 'room rent', 'pg rent', 'paying guest', 'maintenance', 'society maintenance', 'society', 'hoa', 'mortgage', 'plumber', 'electrician', 'carpenter', 'repair', 'repairs', 'painting', 'painter', 'pest control', 'furniture', 'sofa', 'mattress', 'bed', 'table', 'chair', 'curtains', 'home decor', 'decor', 'kitchen', 'utensils', 'cookware', 'appliance', 'appliances', 'fridge', 'refrigerator', 'washing machine', 'microwave', 'ac service', 'ac repair', 'air conditioner', 'maid', 'house help', 'housekeeping', 'cook', 'cleaning', 'cleaner', 'laundry', 'dry cleaning', 'dryclean', 'ironing', 'bulb', 'bulbs', 'locksmith', 'gardening', 'plants', 'water purifier', 'ro service', 'geyser', '~house', '~home',
    '!Urban Company', '!UrbanClap', '!IKEA', '!Pepperfry', '!Urban Ladder', '!Home Depot', "!Lowe's", '!Wayfair', '!HomeCentre', '!Home Centre', '!NoBroker'],
  health: ['doctor', 'dr', 'clinic', 'hospital', 'medicine', 'medicines', 'meds', 'medical', 'pharmacy', 'chemist', 'tablets', 'pills', 'prescription', 'lab test', 'blood test', 'diagnostic', 'diagnostics', 'scan', 'x-ray', 'xray', 'mri', 'ct scan', 'ultrasound', 'dentist', 'dental', 'eye test', 'optician', 'glasses', 'spectacles', 'contact lenses', 'physio', 'physiotherapy', 'therapy', 'therapist', 'counselling', 'counseling', 'vaccine', 'vaccination', 'checkup', 'check-up', 'health checkup', 'consultation', 'gym', 'gym membership', 'fitness', 'yoga', 'pilates', 'zumba', 'crossfit', 'workout', 'protein', 'whey', 'supplements', 'vitamins', 'swimming', '~health',
    '!Apollo', '!Apollo Pharmacy', '!1mg', '!Tata 1mg', '!PharmEasy', '!Netmeds', '!MedPlus', '!Practo', '!Lenskart', '!CVS', '!Walgreens', '!Boots', '!Rite Aid', '!Cult', '!Cult.fit', '!Cultfit', '!Anytime Fitness', "!Gold's Gym", '!Planet Fitness'],
  fun: ['movie', 'movies', 'cinema', 'film', 'films', 'multiplex', 'imax', 'concert', 'gig', '~show', 'standup', 'stand-up', 'comedy show', '~play', 'theatre', 'theater', 'museum', 'zoo', 'amusement park', 'theme park', 'water park', 'games', 'gaming', 'game', 'video game', 'bowling', 'arcade', 'escape room', 'party', 'clubbing', 'club', 'nightclub', 'outing', 'hobby', 'event', 'events', 'festival', 'fest', 'match', 'cricket', 'football', 'sports', 'turf', 'golf', 'karaoke', '~tickets', '~ticket',
    '!PVR', '!INOX', '!Cinepolis', '!BookMyShow', '!Book My Show', '!District', '!Paytm Insider', '!Wonderla', '!Imagica', '!Steam', '!PlayStation', '!PSN', '!Xbox', '!Nintendo', '!Epic Games'],
  subs: ['subscription', 'subscriptions', 'membership', 'renewal', 'annual plan', 'monthly plan', '~plan', 'premium',
    '!Netflix', '!Spotify', '!Amazon Prime', '!Prime Video', '!Prime', '!Hotstar', '!Disney+', '!Disney Plus', '!Disney', '!JioHotstar', '!JioCinema', '!SonyLIV', '!ZEE5', '!YouTube Premium', '!YouTube Music', '!YouTube', '!Apple Music', '!Apple TV', '!Apple One', '!iCloud', '!Google One', '!Google Play', '!Dropbox', '!ChatGPT', '!OpenAI', '!Claude', '!Anthropic', '!Notion', '!Canva', '!Adobe', '!Microsoft 365', '!Office 365', '!LinkedIn Premium', '!Audible', '!Kindle Unlimited', '!HBO Max', '!HBO', '!Hulu', '!Paramount+', '!Peacock', '!Crunchyroll', '!Duolingo', '!Patreon', '!Substack', '!GitHub', '!Figma', '!Zoom', '!Xbox Game Pass', '!PlayStation Plus', '!Swiggy One', '!Zomato Gold', '!Times Prime'],
  travel: ['flight', 'flights', 'airfare', 'air ticket', 'plane ticket', 'airline', 'airport', 'hotel', 'hotels', 'resort', '~stay', 'homestay', 'hostel', 'train ticket', 'train tickets', 'railway', 'railways', 'bus ticket', 'visa', 'visa fee', 'passport', 'trip', 'vacation', '~holiday', 'tour', 'sightseeing', 'luggage', 'suitcase', 'forex', 'travel',
    '!IndiGo', '!Air India', '!Vistara', '!SpiceJet', '!Akasa', '!Emirates', '!Qatar Airways', '!Lufthansa', '!British Airways', '!United Airlines', '!Delta', '!American Airlines', '!Southwest', '!Ryanair', '!easyJet', '!Etihad', '!Singapore Airlines', '!Airbnb', '!OYO', '!Booking.com', '!MakeMyTrip', '!MMT', '!Goibibo', '!Cleartrip', '!Yatra', '!ixigo', '!EaseMyTrip', '!Agoda', '!Expedia', '!Trivago', '!IRCTC', '!redBus', '!AbhiBus'],
  edu: ['school', 'school fees', 'school fee', 'college', 'college fees', 'university', 'tuition', 'tuition fees', 'tuitions', 'coaching', 'course', 'courses', 'class', 'classes', 'lesson', 'lessons', 'training', 'workshop', 'certification', 'exam', 'exam fee', 'exam fees', 'test fee', 'books', 'book', 'textbook', 'textbooks', 'notebook', 'notebooks', 'stationery', 'pen', 'pens', 'library', '~fees', '~fee',
    '!Udemy', '!Coursera', '!edX', "!BYJU'S", '!Byjus', '!Unacademy', '!upGrad', '!Skillshare', '!MasterClass', '!Kindle', '!Physics Wallah', '!Vedantu', '!Chegg', '!Khan Academy'],
  care: ['salon', 'haircut', 'hair cut', 'hair', 'barber', 'spa', 'massage', 'facial', 'manicure', 'pedicure', 'waxing', 'threading', 'grooming', 'parlour', 'parlor', 'beauty parlour', 'beauty', 'cosmetics', 'makeup', 'make up', 'skincare', 'skin care', 'sunscreen', 'moisturizer', 'shampoo', 'conditioner', 'perfume', 'deodorant', 'deo', 'razor', 'trimmer', 'soap', 'toothpaste', 'toiletries', 'sanitary', 'pads', '~trim',
    '!Nykaa', '!Sephora', '!Lakme', '!Naturals Salon', '!Green Trends', '!Bodycraft', '!Toni & Guy', '!Ulta', '!The Body Shop', '!Mamaearth', '!Purplle'],
  family: ['kids', 'kid', 'child', 'children', 'baby', 'babies', 'diapers', 'diaper', 'nappies', 'toys', 'toy', 'daycare', 'day care', 'creche', 'babysitter', 'nanny', 'school supplies', 'school uniform', 'uniform', '~mom', '~mum', '~dad', '~father', '~mother', '~family', '~in-laws', '~pocket money', '~allowance',
    '!FirstCry', '!Hamleys'],
  sendhome: ['sending home', 'send home', 'sent home', 'home money', 'money home', 'money to parents', 'money to mom', 'money to dad', 'to parents', 'for parents', 'family support', 'parents support', 'remittance', 'remit', '~parents', '~amma', '~appa', '~aai', '~papa', '~mummy', '!Western Union', '!Remitly'],
  gifts: ['gift', 'gifts', 'present', 'presents', 'donation', 'donations', 'donate', 'donated', 'charity', 'ngo', 'temple', 'church', 'mosque', 'gurudwara', 'gurdwara', 'offering', 'tithe', 'puja', 'pooja', 'wedding gift', 'birthday gift', 'shagun', 'contribution', 'fundraiser', 'crowdfunding', 'bouquet', 'greeting card', '~flowers',
    '!Ketto', '!Milaap', '!GoFundMe', '!GiveIndia'],
  emi: ['emi', 'emis', 'loan', 'loan emi', 'loan repayment', 'loan payment', 'home loan', 'car loan', 'personal loan', 'education loan', 'bike loan', 'gold loan', 'student loan', 'repayment', 'installment', 'instalment', 'loan interest', '~interest', 'bnpl',
    '!Simpl', '!LazyPay', '!Slice', '!ZestMoney', '!Bajaj Finserv', '!Bajaj Finance'],
  insurance: ['insurance', 'insurance premium', 'policy', 'policy premium', 'health insurance', 'life insurance', 'term insurance', 'term plan', 'car insurance', 'bike insurance', 'vehicle insurance', 'travel insurance', 'home insurance', 'mediclaim',
    '!LIC', '!Star Health', '!HDFC Ergo', '!ICICI Lombard', '!ICICI Prudential', '!Max Life', '!Acko', '!Digit', '!Niva Bupa', '!Care Health', '!Bajaj Allianz', '!Tata AIG', '!PolicyBazaar', '!GEICO', '!State Farm', '!Progressive', '!Allstate', '!Aviva'],
  fees: ['tax', 'taxes', 'income tax', 'gst', 'tds', 'property tax', 'house tax', 'advance tax', 'road tax', 'professional tax', '~fine', 'fines', 'penalty', 'challan', 'traffic fine', 'late fee', 'late fees', 'bank charges', 'bank charge', 'service charge', 'convenience fee', 'processing fee', 'annual fee', 'atm fee', 'atm charges', 'overdraft', 'stamp duty', 'registration', 'registration fee', 'government fee', 'govt fee', 'rto', 'legal', 'lawyer', 'advocate', 'notary', 'ca fees', 'accountant', '~fee', '~fees', '~charges'],
  invest: ['sip', 'sips', 'mutual fund', 'mutual funds', 'mf', 'stocks', 'stock', '~shares', '~share', 'equity', 'etf', 'index fund', 'fd', 'fixed deposit', 'rd', 'recurring deposit', 'ppf', 'nps', 'epf', 'vpf', 'sgb', 'gold bond', 'sovereign gold bond', 'digital gold', 'gold coin', '~gold', 'crypto', 'bitcoin', 'btc', 'ethereum', 'eth', '401k', '401 k', 'ira', 'roth ira', 'roth', 'savings', 'saved', '~save', 'invest', 'invested', 'investment', 'investments', 'emergency fund', '~deposit', 'chit fund', 'chit', 'bonds', 'treasury',
    '!Zerodha', '!Groww', '!Upstox', '!Angel One', '!Kuvera', '!Smallcase', '!INDmoney', '!Paytm Money', '!ET Money', '!Coinbase', '!WazirX', '!Binance', '!CoinDCX', '!Robinhood', '!Vanguard', '!Fidelity', '!Schwab', '!Wealthsimple', '!Trading 212', '!Freetrade'],
  transfer: ['credit card bill', 'cc bill', 'card bill', 'credit card payment', 'cc payment', 'credit card due', 'card dues', 'self transfer', 'own account', 'to savings account', 'transfer to savings', 'moved to savings', 'sent to savings', 'atm', 'atm withdrawal', 'cash withdrawal', 'withdrew', 'withdrawal', 'withdraw', 'wallet top up', 'wallet topup', 'wallet top-up', 'top up', 'topup', 'top-up', 'add money', 'added money', 'lent', 'lend', 'loaned', 'paid back', 'settle up', 'settled up', '!Splitwise', '~transfer', '~transferred'],
  other: ['~misc', '~miscellaneous', '~others', '~random', '~stuff'],
  salary: ['salary', 'salaries', 'salery', 'paycheck', 'pay check', 'paycheque', 'payslip', 'payroll', 'wages', 'wage', 'stipend', 'pension', 'increment', 'arrears', 'overtime', '~pay'],
  bonus: ['bonus', 'bonuses', 'incentive', 'incentives', 'performance bonus', 'joining bonus', 'diwali bonus', 'festival bonus', 'variable pay', 'esop', 'esops', 'rsu', 'rsus'],
  business: ['freelance', 'freelancing', 'client', 'client payment', 'invoice', 'invoices', 'consulting', 'consultancy', 'project payment', '~project', 'gig', 'side hustle', 'business', 'sales', 'revenue', 'commission', 'fees received', 'professional fees', 'royalty', 'royalties', 'youtube income', 'affiliate', 'tuition income', 'teaching', '!Upwork', '!Fiverr', '!Toptal', '!AdSense', '~payment', '~work'],
  returns: ['interest', 'fd interest', 'savings interest', 'interest credited', 'dividend', 'dividends', 'capital gains', 'profit', 'profits', 'stock profit', 'returns', '~return', 'maturity', 'redemption', 'coupon', 'yield'],
  refund: ['refund', 'refunded', 'refunds', 'cashback', 'cash back', 'reimbursement', 'reimbursed', 'reimburse', 'insurance claim', '~claim', 'reversal', 'reversed', 'chargeback', 'money back'],
  gift_in: ['gift', 'gifted', 'gifts', 'birthday money', 'shagun', 'gift from', 'from mom', 'from dad', 'from parents', 'from grandma', 'from grandpa', 'blessing'],
  rental: ['rental income', 'rent received', 'rent from tenant', 'rent income', 'tenant', 'tenants', 'lease income', 'house rent received'],
  other_in: ['sold', 'resale', 'lottery', 'prize', 'won', 'winnings', '~allowance', '~pocket money']
};

/* Normalize free text for keyword matching. */
function normText(s) {
  return ' ' + String(s || '').toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9@.'+\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() + ' ';
}
function kwRegex(phrase) {
  const p = normText(phrase).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(?:^|[^a-z0-9])' + p + (/[a-z]$/.test(p) ? '(?:e?s)?' : '') + '(?=$|[^a-z0-9])');
}
let KW_INDEX = null;
function kwIndex() {
  if (KW_INDEX) return KW_INDEX;
  KW_INDEX = [];
  for (const cat in KW) {
    for (const raw of KW[cat]) {
      let w = 2, brand = '', phrase = raw;
      if (raw[0] === '!') { w = 3; brand = raw.slice(1); phrase = brand; }
      else if (raw[0] === '~') { w = 1; phrase = raw.slice(1); }
      const n = normText(phrase).trim();
      if (n.indexOf(' ') > 0) w += 1;
      KW_INDEX.push({ cat, w, brand, re: kwRegex(phrase), len: n.length });
    }
  }
  return KW_INDEX;
}
