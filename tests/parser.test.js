// Run: node tests/parser.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = ['core.js', 'parser.js'].map(f => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8')).join('\n');
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(src + '\n;this.API = { parseText, normalizeSpoken, detectDate, parseCSV, csvToDrafts, draftsFromAI, DEFAULT_CATS, parseBankMessages };', sandbox);
const A = sandbox.API;

const ctx = { today: '2026-10-29', dateOrder: 'DMY', cats: A.DEFAULT_CATS, rules: {} };
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) pass++;
  else { fail++; console.log('FAIL', name, detail ? '\n   ' + detail : ''); }
}
function matches(actual, exp) {
  for (const k in exp) {
    const a = actual[k], e = exp[k];
    if (Array.isArray(e)) { if (JSON.stringify(a) !== JSON.stringify(e)) return k; }
    else if (a !== e) return k;
  }
  return null;
}
function T(input, expected, c) {
  const r = A.parseText(input, c || ctx);
  if (!Array.isArray(expected)) {
    const bad = matches(r, expected);
    check(input, !bad, 'field ' + bad + ' → ' + JSON.stringify(r));
    return;
  }
  if (r.entries.length !== expected.length) { check(input, false, 'expected ' + expected.length + ' entries, got ' + r.entries.length + ' → ' + JSON.stringify(r.entries.map(e => [e.amount, e.cat, e.note]))); return; }
  expected.forEach((exp, i) => {
    const bad = matches(r.entries[i], exp);
    check(input + ' [#' + i + ']', !bad, 'field ' + bad + ': got ' + JSON.stringify(r.entries[i][bad]) + ' want ' + JSON.stringify(exp[bad]) + ' | ' + JSON.stringify(r.entries[i]));
  });
}

// ---- everyday phrases
T('coffee 120', [{ amount: 120, type: 'expense', cat: 'food', date: '2026-10-29', note: 'Coffee' }]);
T('Uber 230 yesterday', [{ amount: 230, cat: 'transport', date: '2026-10-28', merchant: 'Uber', note: 'Uber' }]);
T('Spent 450 on groceries at DMart yesterday via UPI', [{ amount: 450, cat: 'groceries', date: '2026-10-28', method: 'UPI', merchant: 'DMart', note: 'Groceries at DMart' }]);
T('Salary 85000 credited', [{ amount: 85000, type: 'income', cat: 'salary', note: 'Salary' }]);
T('Got salary 85k', [{ amount: 85000, type: 'income', cat: 'salary' }]);
T('Netflix 649 monthly', [{ amount: 649, cat: 'subs', repeat: 'monthly', note: 'Netflix' }]);
T('Paid rent 25k', [{ amount: 25000, cat: 'home', note: 'Rent' }]);
T('Received 2000 from Rahul', [{ amount: 2000, type: 'income', cat: 'other_in', merchant: 'Rahul', note: 'From Rahul' }]);
T('Petrol 1.5k on card', [{ amount: 1500, cat: 'transport', method: 'Card', note: 'Petrol' }]);
T('coffee 120, lunch 350', [{ amount: 120, cat: 'food' }, { amount: 350, cat: 'food', note: 'Lunch' }]);
T('lunch 350 and movie 500', [{ amount: 350, cat: 'food' }, { amount: 500, cat: 'fun', note: 'Movie' }]);
T('2 coffees 240', [{ amount: 240, cat: 'food', note: '2 coffees' }]);
T('bread and butter 80', [{ amount: 80, cat: 'groceries' }]);
T('two hundred fifty for chai', [{ amount: 250, cat: 'food', note: 'Chai' }]);
T('one lakh twenty thousand bonus', [{ amount: 120000, type: 'income', cat: 'bonus' }]);
T('Dinner for 4 people 3200', [{ amount: 3200, cat: 'food' }]);
T('petrol 2000 at 102 per litre', [{ amount: 2000, cat: 'transport' }]);
T('Amazon order 1299 on credit card', [{ amount: 1299, cat: 'shopping', method: 'Credit Card', merchant: 'Amazon' }]);
T('Swiggy 450', [{ amount: 450, cat: 'food', merchant: 'Swiggy' }]);
T('Uber Eats 650', [{ amount: 650, cat: 'food', merchant: 'Uber Eats' }]);
T('Swiggy Instamart 820', [{ amount: 820, cat: 'groceries', merchant: 'Swiggy Instamart' }]);
T('electricity bill 1800', [{ amount: 1800, cat: 'bills', note: 'Electricity bill' }]);
T('paid credit card bill 15000 via netbanking', [{ amount: 15000, cat: 'transfer', method: 'Bank Transfer', note: 'Credit card bill' }]);
T('SIP 5000', [{ amount: 5000, cat: 'invest' }]);
T('refund from amazon 499', [{ amount: 499, type: 'income', cat: 'refund' }]);
T('cashback 50', [{ amount: 50, type: 'income', cat: 'refund' }]);
T('gym 2000 every month', [{ amount: 2000, cat: 'health', repeat: 'monthly', note: 'Gym' }]);
T('bought shoes from nike for 3500', [{ amount: 3500, cat: 'shopping', merchant: 'Nike', note: 'Shoes from nike' }]);
T('+5000 freelance', [{ amount: 5000, type: 'income', cat: 'business' }]);
T('freelance project 12000', [{ amount: 12000, type: 'income', cat: 'business' }]);
T('paid maid salary 6000', [{ amount: 6000, type: 'expense', cat: 'home' }]);
T('Movie tickets 600 on 25th', [{ amount: 600, cat: 'fun', date: '2026-10-25', note: 'Movie tickets' }]);
T('groceries 900 on 5 oct', [{ amount: 900, cat: 'groceries', date: '2026-10-05' }]);
T('dinner 1200 last friday', [{ amount: 1200, cat: 'food', date: '2026-10-23' }]);
T('taxi 300 on monday', [{ amount: 300, cat: 'transport', date: '2026-10-26' }]);
T('medicines 340 3 days ago', [{ amount: 340, cat: 'health', date: '2026-10-26' }]);
T('hotel 8500 12/10', [{ amount: 8500, cat: 'travel', date: '2026-10-12' }]);
T('rs 50 chai rs 30 biscuit', [{ amount: 50, cat: 'food' }, { amount: 30 }]);
T('dinner ₹500 tip ₹200', [{ amount: 500, cat: 'food' }, { amount: 200, cat: 'food' }]);
T('Paid 50 for 2 samosas', [{ amount: 50, cat: 'food' }]);
T('water 20 x 2', [{ amount: 40 }]);
T('coffee 4.50', [{ amount: 4.5, cat: 'food' }]);
T('Lunch with team 1,250', [{ amount: 1250, cat: 'food', note: 'Lunch with team' }]);
T('Electricity 1450 paid via phonepe', [{ amount: 1450, cat: 'bills', method: 'UPI' }]);
T('haircut 300 cash', [{ amount: 300, cat: 'care', method: 'Cash', note: 'Haircut' }]);
T('LIC premium 12000 yearly', [{ amount: 12000, cat: 'insurance', repeat: 'yearly' }]);
T('school fees 15000', [{ amount: 15000, cat: 'edu' }]);
T('atm withdrawal 5000', [{ amount: 5000, cat: 'transfer' }]);
T('Lent 1000 to Amit', [{ amount: 1000, cat: 'transfer' }]);
T('Zomato 389 #weekend', [{ amount: 389, cat: 'food', tags: ['weekend'], note: 'Zomato' }]);
T('pizza 499 and coke 60 yesterday on card', [{ amount: 499, date: '2026-10-28', method: 'Card' }, { amount: 60, date: '2026-10-28', method: 'Card' }]);
T('iphone 15 case 999', [{ amount: 999, cat: 'shopping' }]);
T('zee5 subscription 599', [{ amount: 599, cat: 'subs' }]);
T('Tata 1mg medicines 450', [{ amount: 450, cat: 'health' }]);
T('got 500 from mom', [{ amount: 500, type: 'income', cat: 'gift_in' }]);
T('interest 1200', [{ amount: 1200, type: 'income', cat: 'returns' }]);
T('loan interest 3000', [{ amount: 3000, type: 'expense', cat: 'emi' }]);
T('sold old phone 8000', [{ amount: 8000, type: 'income', cat: 'other_in' }]);
T('rent received 15000', [{ amount: 15000, type: 'income', cat: 'rental' }]);
T('paid back 2000 to rahul', [{ amount: 2000, cat: 'transfer' }]);
T('Mom birthday gift 2500', [{ amount: 2500, type: 'expense', cat: 'gifts' }]);
T('apple music 99 per month', [{ amount: 99, cat: 'subs', repeat: 'monthly' }]);
T('paid 5,000 to plumber', [{ amount: 5000, cat: 'home' }]);
T('coffee 120 rs', [{ amount: 120, cat: 'food', note: 'Coffee' }]);
T('₹ 2,499 myntra', [{ amount: 2499, cat: 'shopping', merchant: 'Myntra' }]);
T('dinner 1450 split 2 ways', [{ amount: 1450, cat: 'food' }]);
T('Bus 15', [{ amount: 15, cat: 'transport' }]);
T('Auto 80', [{ amount: 80, cat: 'transport' }]);
T('Salary 5,200 credited', [{ amount: 5200, type: 'income', cat: 'salary' }]);
T('Starbucks 6.45 on visa', [{ amount: 6.45, cat: 'food', method: '' }]);
T("Groceries $82.40 at Trader Joe's", [{ amount: 82.4, cat: 'groceries', merchant: "Trader Joe's" }]);
T('paid electricity bill 2,340 on 3rd', [{ amount: 2340, cat: 'bills', date: '2026-10-03' }]);
T('Netflix 649 on the 5th every month', [{ amount: 649, cat: 'subs', repeat: 'monthly', date: '2026-10-05' }]);
T('chai 20 and samosa 15 and biscuit 10', [{ amount: 20 }, { amount: 15 }, { amount: 10 }]);
T('five hundred and fifty for groceries', [{ amount: 550, cat: 'groceries' }]);
T('burgers 400', [{ amount: 400, cat: 'food' }]);
T('flowers 200', [{ amount: 200, cat: 'gifts' }]);
T('paid salary to driver 12000', [{ amount: 12000, type: 'expense', cat: 'transport' }]);
T('Rahul paid me 500', [{ amount: 500, type: 'income' }]);
T('metro card recharge 500', [{ amount: 500, cat: 'transport', method: '' }]);
T('gas 45', { needsAI: true });
T('coffee', [{ amount: 0 }]);
T('fuel 3000 on 15/09/2026', [{ amount: 3000, date: '2026-09-15' }]);
T('vegetables 60 day before yesterday', [{ amount: 60, cat: 'groceries', date: '2026-10-27' }]);
T('spotify 119 yearly', [{ amount: 119, repeat: 'yearly' }]);
T('Flight to Delhi 6,450 on 5th Nov', [{ amount: 6450, cat: 'travel', date: '2026-11-05' }]);

// ---- two people: who paid, and who it is for
const hh = Object.assign({}, ctx, { members: [{ id: 'p1', name: 'Ravi' }, { id: 'p2', name: 'Meera' }] });
T('Meera paid 450 for groceries', [{ amount: 450, cat: 'groceries', paid: 'p2', who: '', note: 'Groceries' }], hh);
T('Meera paid 600 for dessert for both', [{ amount: 600, cat: 'food', paid: 'p2', who: 'joint', note: 'Dessert' }], hh);
T('dessert 600 paid by Meera, shared', [{ amount: 600, paid: 'p2', who: 'joint', note: 'Dessert' }], hh);
T("Ravi paid Meera's cab 300", [{ amount: 300, cat: 'transport', paid: 'p1', who: 'p2', note: 'Cab' }], hh);
T("Meera's medicine 450 paid by Ravi", [{ amount: 450, cat: 'health', paid: 'p1', who: 'p2' }], hh);
T('we went for dinner 1800, Meera paid', [{ amount: 1800, cat: 'food', paid: 'p2', who: 'joint', note: 'Dinner' }], hh);
T('Ravi salary 85000', [{ amount: 85000, type: 'income', cat: 'salary', who: 'p1', note: 'Salary' }], hh);
T('shared dinner 2400', [{ amount: 2400, cat: 'food', who: 'joint', paid: '', note: 'Dinner' }], hh);
T('our rent 22000', [{ amount: 22000, cat: 'home', who: 'joint', note: 'Rent' }], hh);
T('coffee 120', [{ amount: 120, who: '', paid: '' }], hh);
T('sending home 10000', [{ amount: 10000, cat: 'sendhome' }], hh);
T('Meera freelance 15000', [{ amount: 15000, type: 'income', cat: 'business', who: 'p2' }], hh);
T('dinner 1200 for Meera', [{ amount: 1200, cat: 'food', who: 'p2', paid: '', note: 'Dinner' }], hh);
T('Ravi and Meera movie 900', [{ amount: 900, cat: 'fun', who: 'joint' }], hh);
T('Ravi petrol 2000', [{ amount: 2000, cat: 'transport', who: 'p1', paid: 'p1', note: 'Petrol' }], hh);
T('diwali bonus 20000', [{ amount: 20000, type: 'income', cat: 'bonus' }], hh);
T('shared groceries 900, Ravi petrol 2000', [{ amount: 900, who: 'joint' }, { amount: 2000, who: 'p1', paid: 'p1', cat: 'transport' }], hh);
T('dinner 450 at Toit and shared groceries 1240', [{ amount: 450, who: '', cat: 'food' }, { amount: 1240, who: 'joint', cat: 'groceries' }], hh);
T('shared: dinner 450 and movie 500', [{ amount: 450, who: 'joint' }, { amount: 500, who: 'joint' }], hh);
T('Meera paid for dinner 450 and movie 500', [{ amount: 450, paid: 'p2' }, { amount: 500, paid: 'p2' }], hh);
T('Meera paid 450 for dinner and Ravi cab 230', [{ amount: 450, paid: 'p2', who: '', cat: 'food' }, { amount: 230, paid: 'p1', who: 'p1', cat: 'transport' }], hh);
T('we had pizza 900', [{ amount: 900, who: 'joint', note: 'Pizza' }], hh);

// ---- budget commands
T('budget food 8000', { kind: 'command' });
check('budget food 8000 → food', (A.parseText('budget food 8000', ctx).command || {}).cat === 'food', JSON.stringify(A.parseText('budget food 8000', ctx)));
check('monthly budget 45000', (() => { const c = A.parseText('monthly budget 45000', ctx).command; return c && c.cat === null && c.amount === 45000; })(), JSON.stringify(A.parseText('monthly budget 45000', ctx)));
check('set groceries budget to 6000', (() => { const c = A.parseText('set groceries budget to 6000', ctx).command; return c && c.cat === 'groceries' && c.amount === 6000; })(), JSON.stringify(A.parseText('set groceries budget to 6000', ctx)));
T('budget hotel 2500', { kind: 'entries' });

// ---- bank messages
T('Rs.450.00 debited from A/c XX1234 on 28-10-26 to VPA swiggy@axisbank. UPI Ref 123456789012.', [{ amount: 450, type: 'expense', merchant: 'Swiggy', cat: 'food', date: '2026-10-28', method: 'UPI' }]);
T('INR 1,250.00 spent on your HDFC Bank Credit Card ending 1234 at AMAZON on 2026-10-27:10:15:22. Avl Lmt: INR 45,000', [{ amount: 1250, type: 'expense', merchant: 'Amazon', cat: 'shopping', method: 'Credit Card', date: '2026-10-27' }]);
T('Your a/c no. XXXXXXXX1234 is credited with Rs.85,000.00 on 01-10-2026 by NEFT ACME CORP SALARY', [{ amount: 85000, type: 'income', cat: 'salary', date: '2026-10-01' }]);
T('Sent Rs.200.00 From HDFC Bank A/C *1234 To RAHUL SHARMA On 27/10/26 Ref 1234', [{ amount: 200, type: 'expense', merchant: 'Rahul Sharma', date: '2026-10-27' }]);
T('Rs 2000 withdrawn at ATM on 26-10-2026 from a/c XX1234. Avl bal Rs 50,000', [{ amount: 2000, cat: 'transfer', date: '2026-10-26' }]);
T('Rs.450.00 debited from A/c XX1234 on 28-10-26 to VPA swiggy@axisbank.\n\nINR 120 debited from a/c XX1234 on 29-10-26 to VPA chaayos.upi@okicici', [{ amount: 450, merchant: 'Swiggy' }, { amount: 120, merchant: 'Chaayos', cat: 'food' }]);

// ---- spoken numbers
const N = A.normalizeSpoken;
check('five hundred and fifty', N('five hundred and fifty') === '550', N('five hundred and fifty'));
check('twenty-five', N('twenty-five') === '25', N('twenty-five'));
check('a thousand', N('a thousand bucks') === '1000 bucks', N('a thousand bucks'));
check('2 thousand 500', N('2 thousand 500') === '2500', N('2 thousand 500'));
check('4 dollars 50 cents', N('4 dollars 50 cents') === '4.50 dollars', N('4 dollars 50 cents'));
check('date MDY', (A.detectDate('05/10/2026', { today: '2026-10-29', dateOrder: 'MDY' }) || {}).date === '2026-05-10');

// ---- CSV
const csv1 = 'Date,Description,Debit,Credit,Balance\n01/10/2026,NEFT-ACME CORP SALARY,,85000.00,95000.00\n02/10/2026,UPI/P2M/123456789/SWIGGY,450.00,,94550.00\n15/10/2026,POS 1234 DMART MUMBAI,"2,310.50",,92239.50\n';
const r1 = A.csvToDrafts(A.parseCSV(csv1), ctx);
check('csv1 count', r1.drafts.length === 3, JSON.stringify(r1));
if (r1.drafts.length === 3) {
  check('csv1 salary', r1.drafts[0].type === 'income' && r1.drafts[0].cat === 'salary' && r1.drafts[0].amount === 85000 && r1.drafts[0].date === '2026-10-01', JSON.stringify(r1.drafts[0]));
  check('csv1 swiggy', r1.drafts[1].cat === 'food' && r1.drafts[1].amount === 450 && r1.drafts[1].note === 'Swiggy', JSON.stringify(r1.drafts[1]));
  check('csv1 dmart', r1.drafts[2].cat === 'groceries' && r1.drafts[2].amount === 2310.5 && r1.drafts[2].date === '2026-10-15', JSON.stringify(r1.drafts[2]));
}
const csv2 = 'Transaction Date,Post Date,Description,Category,Type,Amount\n10/05/2026,10/06/2026,STARBUCKS STORE 123,Food & Drink,Sale,-5.75\n10/07/2026,10/08/2026,UBER   TRIP,Travel,Sale,-23.10\n';
const r2 = A.csvToDrafts(A.parseCSV(csv2), Object.assign({}, ctx, { dateOrder: 'MDY' }));
check('csv2 count', r2.drafts.length === 2, JSON.stringify(r2));
if (r2.drafts.length === 2) {
  check('csv2 starbucks', r2.drafts[0].cat === 'food' && r2.drafts[0].amount === 5.75 && r2.drafts[0].type === 'expense' && r2.drafts[0].date === '2026-10-05', JSON.stringify(r2.drafts[0]));
}

// ---- AI mapping
const ai = A.draftsFromAI({ entries: [{ type: 'expense', amount: '1,299', category: 'shopping', date: '2026-10-20', note: 'headphones', merchant: 'Croma', method: 'card', repeat: 'none' }, { type: 'income', amount: 0 }] }, ctx);
check('ai map', ai.length === 1 && ai[0].amount === 1299 && ai[0].cat === 'shopping' && ai[0].method === 'Card' && ai[0].note === 'Headphones', JSON.stringify(ai));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
