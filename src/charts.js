/* ===================== charts: SVG + HTML, theme tokens, hover tooltips, table views ===================== */
function niceScale(max, count) {
  if (!(max > 0)) return { max: 1, ticks: [0, 1] };
  const raw = max / (count || 4);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(s => s * pow).find(s => s >= raw) || pow * 10;
  const top = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  for (let v = 0; v <= top + step * 1e-6; v += step) ticks.push(Math.round(v * 100) / 100);
  return { max: top, ticks };
}
const f1 = v => Math.round(v * 10) / 10;

/* one tooltip for every chart; content is set with textContent */
function showTip(clientX, clientY, title, rows) {
  const el = document.getElementById('tip');
  if (!el) return;
  el.textContent = '';
  if (title) { const h = document.createElement('div'); h.className = 'tip-title'; h.textContent = title; el.appendChild(h); }
  for (const r of rows) {
    const row = document.createElement('div'); row.className = 'tip-row';
    if (r.color) { const k = document.createElement('span'); k.className = 'tip-key' + (r.dashed ? ' dashed' : ''); k.style.setProperty('--k', r.color); row.appendChild(k); }
    const v = document.createElement('strong'); v.textContent = r.value; row.appendChild(v);
    const l = document.createElement('span'); l.className = 'tip-label'; l.textContent = r.label; row.appendChild(l);
    el.appendChild(row);
  }
  el.hidden = false;
  const w = el.offsetWidth, h = el.offsetHeight;
  let left = clientX + 14, top = clientY - h - 14;
  if (left + w > window.innerWidth - 8) left = clientX - w - 14;
  if (left < 8) left = 8;
  if (top < 8) top = clientY + 18;
  el.style.left = left + 'px';
  el.style.top = top + 'px';
}
function hideTip() { const el = document.getElementById('tip'); if (el) el.hidden = true; }
function svgPoint(svg, ev, W) { const r = svg.getBoundingClientRect(); return (ev.clientX - r.left) * (W / r.width); }
function colPath(x, y, w, h, r) {
  if (h <= 0) return '';
  r = Math.min(r, h, w / 2);
  return `M${f1(x)},${f1(y + h)}V${f1(y + r)}Q${f1(x)},${f1(y)} ${f1(x + r)},${f1(y)}H${f1(x + w - r)}Q${f1(x + w)},${f1(y)} ${f1(x + w)},${f1(y + r)}V${f1(y + h)}Z`;
}
function chartWidth(el) { return Math.max(260, Math.floor(el.clientWidth || el.getBoundingClientRect().width || 320)); }

/* cumulative spending this period vs last period, budget line and projection */
function paceChart(el, A) {
  const W = chartWidth(el), H = 224, m = { l: 46, r: 14, t: 18, b: 28 };
  const N = A.p.days, n = A.isCurrent ? A.dayIndex : (A.isFuture ? 0 : N);
  const prevN = Math.min(A.prevCum.length, N);
  const proj = A.isCurrent && n < N ? A.projection : 0;
  const sc = niceScale(Math.max(n ? A.cum[n - 1] : 0, prevN ? A.prevCum[prevN - 1] : 0, A.budgetTotal || 0, proj, 1) * 1.04, 4);
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const x = d => m.l + (N <= 1 ? 0 : (d - 1) / (N - 1) * iw);
  const y = v => m.t + ih - (v / sc.max) * ih;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Running total of spending this period compared with last period">`;
  for (const t of sc.ticks) s += `<line class="grid${t === 0 ? ' base' : ''}" x1="${m.l}" x2="${W - m.r}" y1="${f1(y(t))}" y2="${f1(y(t))}"/><text class="tick" x="${m.l - 8}" y="${f1(y(t) + 4)}" text-anchor="end">${esc(compact(t))}</text>`;
  const xd = N > 2 ? [1, Math.ceil(N / 2), N] : [1, N];
  for (const d of xd) s += `<text class="tick" x="${f1(x(d))}" y="${H - 8}" text-anchor="${d === 1 ? 'start' : d === N ? 'end' : 'middle'}">${esc(shortDate(addDays(A.p.start, d - 1)))}</text>`;
  if (A.budgetTotal) s += `<line class="ln-budget" x1="${m.l}" x2="${W - m.r}" y1="${f1(y(A.budgetTotal))}" y2="${f1(y(A.budgetTotal))}"/><text class="lbl halo" x="${m.l + 6}" y="${f1(y(A.budgetTotal) - 7)}">Budget ${esc(compact(A.budgetTotal))}</text>`;
  if (prevN) {
    let d = '';
    for (let i = 1; i <= prevN; i++) d += (i === 1 ? 'M' : 'L') + f1(x(i)) + ',' + f1(y(A.prevCum[i - 1]));
    s += `<path class="ln-prev" d="${d}"/>`;
  }
  if (n) {
    let d = '';
    for (let i = 1; i <= n; i++) d += (i === 1 ? 'M' : 'L') + f1(x(i)) + ',' + f1(y(A.cum[i - 1]));
    s += `<path class="area-cur" d="${d}L${f1(x(n))},${f1(y(0))}L${f1(x(1))},${f1(y(0))}Z"/><path class="ln-cur" d="${d}"/>`;
  }
  const ex = n ? x(n) : 0, ey = n ? y(A.cum[n - 1]) : 0;
  let projLabel = null;
  if (proj && n) {
    s += `<path class="ln-proj" d="M${f1(ex)},${f1(ey)}L${f1(x(N))},${f1(y(proj))}"/>`;
    projLabel = { x: x(N), y: y(proj) - 9 };
    s += `<text class="lbl halo" x="${f1(projLabel.x)}" y="${f1(Math.max(12, projLabel.y))}" text-anchor="end">${esc(compact(proj))} projected</text>`;
  }
  if (n) {
    s += `<circle class="dot-ring" cx="${f1(ex)}" cy="${f1(ey)}" r="6"/><circle class="dot-cur" cx="${f1(ex)}" cy="${f1(ey)}" r="4"/>`;
    const clash = projLabel && Math.abs(projLabel.y - (ey - 12)) < 16 && Math.abs(projLabel.x - ex) < 120;
    if (!clash) s += `<text class="lbl halo strong" x="${f1(ex + (ex > W - 90 ? -10 : 10))}" y="${f1(Math.max(12, ey - 10))}" text-anchor="${ex > W - 90 ? 'end' : 'start'}">${esc(compact(A.cum[n - 1]))}</text>`;
  }
  s += `<line class="xhair" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/><g class="hov"></g><rect class="hit" x="${m.l}" y="0" width="${iw}" height="${H - m.b}"/></svg>`;
  el.innerHTML = s;
  const svg = el.querySelector('svg'), xh = svg.querySelector('.xhair'), hov = svg.querySelector('.hov');
  const move = ev => {
    const d = clamp(Math.round((svgPoint(svg, ev, W) - m.l) / iw * (N - 1)) + 1, 1, N);
    xh.setAttribute('x1', f1(x(d))); xh.setAttribute('x2', f1(x(d))); xh.setAttribute('visibility', 'visible');
    const rows = [];
    let dots = '';
    if (d <= n) { rows.push({ label: 'this period', value: money(A.cum[d - 1]), color: 'var(--series-1)' }); dots += `<circle class="dot-ring" cx="${f1(x(d))}" cy="${f1(y(A.cum[d - 1]))}" r="6"/><circle class="dot-cur" cx="${f1(x(d))}" cy="${f1(y(A.cum[d - 1]))}" r="4"/>`; }
    else if (proj) { const pv = A.cum[n - 1] + (proj - A.cum[n - 1]) * (d - n) / (N - n); rows.push({ label: 'projected', value: money(niceRound(pv)), color: 'var(--series-1)', dashed: true }); }
    if (d <= prevN) { rows.push({ label: 'last period', value: money(A.prevCum[d - 1]), color: 'var(--muted-line)' }); dots += `<circle class="dot-ring" cx="${f1(x(d))}" cy="${f1(y(A.prevCum[d - 1]))}" r="5"/><circle class="dot-prev" cx="${f1(x(d))}" cy="${f1(y(A.prevCum[d - 1]))}" r="3.5"/>`; }
    if (A.budgetTotal) rows.push({ label: 'budget', value: money(A.budgetTotal), color: 'var(--budget-line)' });
    hov.innerHTML = dots;
    showTip(ev.clientX, ev.clientY, dayLabel(addDays(A.p.start, d - 1)) + ' · day ' + d, rows);
  };
  const out = () => { xh.setAttribute('visibility', 'hidden'); hov.innerHTML = ''; hideTip(); };
  const hit = svg.querySelector('.hit');
  hit.addEventListener('pointermove', move);
  hit.addEventListener('pointerdown', move);
  hit.addEventListener('pointerleave', out);
}
function paceTable(A) {
  const N = A.p.days, n = A.isCurrent ? A.dayIndex : (A.isFuture ? 0 : N);
  let r = '<table class="tbl"><thead><tr><th>Day</th><th>Spent that day</th><th>Running total</th><th>Last period</th></tr></thead><tbody>';
  for (let d = 1; d <= Math.max(n, 1) && d <= N; d++) r += `<tr><td>${esc(shortDate(addDays(A.p.start, d - 1)))}</td><td>${money(A.daily[d - 1] || 0)}</td><td>${money(A.cum[d - 1] || 0)}</td><td>${d <= A.prevCum.length ? money(A.prevCum[d - 1]) : '–'}</td></tr>`;
  return r + '</tbody></table>';
}

/* six periods: spending and income side by side */
function trendChart(el, A) {
  const W = chartWidth(el), H = 214, m = { l: 46, r: 8, t: 22, b: 28 };
  const first = A.hist.findIndex(h => h.spend > 0 || h.income > 0);
  const data = A.hist.slice(Math.max(0, Math.min(first < 0 ? A.hist.length : first, A.hist.length - 3)));
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const sc = niceScale(Math.max(1, ...data.map(h => Math.max(h.spend, h.income))) * 1.08, 4);
  const y = v => m.t + ih - (v / sc.max) * ih;
  const band = iw / data.length, bw = Math.max(5, Math.min(18, band * 0.3));
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Spending and income per month">`;
  for (const t of sc.ticks) s += `<line class="grid${t === 0 ? ' base' : ''}" x1="${m.l}" x2="${W - m.r}" y1="${f1(y(t))}" y2="${f1(y(t))}"/><text class="tick" x="${m.l - 8}" y="${f1(y(t) + 4)}" text-anchor="end">${esc(compact(t))}</text>`;
  data.forEach((h, i) => {
    const cx = m.l + band * (i + 0.5);
    s += colPath(cx - bw - 1, y(h.spend), bw, y(0) - y(h.spend), 4) ? `<path class="bar-s1" d="${colPath(cx - bw - 1, y(h.spend), bw, y(0) - y(h.spend), 4)}"/>` : '';
    s += colPath(cx + 1, y(h.income), bw, y(0) - y(h.income), 4) ? `<path class="bar-s3" d="${colPath(cx + 1, y(h.income), bw, y(0) - y(h.income), 4)}"/>` : '';
    s += `<text class="tick${i === data.length - 1 ? ' strong' : ''}" x="${f1(cx)}" y="${H - 8}" text-anchor="middle">${esc(periodShort(h.p))}</text>`;
  });
  data.forEach((h, i) => { s += `<rect class="hit band" data-i="${i}" x="${f1(m.l + band * i)}" y="0" width="${f1(band)}" height="${H - m.b}"/>`; });
  s += '</svg>';
  el.innerHTML = s;
  el.querySelectorAll('.band').forEach(r => {
    const i = +r.getAttribute('data-i'), h = data[i];
    const move = ev => {
      el.querySelectorAll('.band').forEach(b => b.classList.toggle('on', b === r));
      showTip(ev.clientX, ev.clientY, periodLabel(h.p), [
        { label: 'spent', value: money(h.spend), color: 'var(--series-1)' },
        { label: 'income', value: money(h.income), color: 'var(--series-3)' },
        { label: h.income - h.spend >= 0 ? 'kept' : 'overspent', value: money(Math.abs(h.income - h.spend)) }
      ]);
    };
    r.addEventListener('pointermove', move); r.addEventListener('pointerdown', move);
    r.addEventListener('pointerleave', () => { r.classList.remove('on'); hideTip(); });
  });
}
function trendTable(A) {
  let r = '<table class="tbl"><thead><tr><th>Period</th><th>Spent</th><th>Income</th><th>Kept</th></tr></thead><tbody>';
  for (const h of A.hist) r += `<tr><td>${esc(periodLabel(h.p))}</td><td>${money(h.spend)}</td><td>${money(h.income)}</td><td>${money(h.income - h.spend)}</td></tr>`;
  return r + '</tbody></table>';
}

/* average day-to-day spending per weekday */
const WD_ORDER = [1, 2, 3, 4, 5, 6, 0];
function weekdayName(i, style) { return fmtDate(addDays('2026-10-04', i), { weekday: style || 'short' }); }
function weekdayChart(el, A) {
  const W = chartWidth(el), H = 176, m = { l: 8, r: 8, t: 22, b: 26 };
  const vals = WD_ORDER.map(i => A.weekday[i]);
  const max = Math.max(...vals, 0);
  const iw = W - m.l - m.r, ih = H - m.t - m.b, band = iw / 7, bw = Math.min(24, band * 0.5);
  const y = v => m.t + ih - (max > 0 ? v / max : 0) * ih;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Average day-to-day spending by weekday">`;
  s += `<line class="grid base" x1="${m.l}" x2="${W - m.r}" y1="${f1(y(0))}" y2="${f1(y(0))}"/>`;
  const top = vals.indexOf(max);
  vals.forEach((v, i) => {
    const cx = m.l + band * (i + 0.5);
    const p = colPath(cx - bw / 2, y(v), bw, y(0) - y(v), 4);
    if (p) s += `<path class="${i === top ? 'bar-s1' : 'bar-s1 soft'}" d="${p}"/>`;
    s += `<text class="tick${i === top ? ' strong' : ''}" x="${f1(cx)}" y="${H - 8}" text-anchor="middle">${esc(weekdayName(WD_ORDER[i]))}</text>`;
    if (i === top && v > 0) s += `<text class="lbl halo strong" x="${f1(cx)}" y="${f1(Math.max(12, y(v) - 6))}" text-anchor="middle">${esc(compact(v))}</text>`;
    s += `<rect class="hit band" data-i="${i}" x="${f1(m.l + band * i)}" y="0" width="${f1(band)}" height="${H - m.b}"/>`;
  });
  s += '</svg>';
  el.innerHTML = s;
  el.querySelectorAll('.band').forEach(r => {
    const i = +r.getAttribute('data-i');
    const move = ev => showTip(ev.clientX, ev.clientY, weekdayName(WD_ORDER[i], 'long'), [{ label: 'average day-to-day spend', value: money(niceRound(vals[i])), color: 'var(--series-1)' }]);
    r.addEventListener('pointermove', move); r.addEventListener('pointerdown', move); r.addEventListener('pointerleave', hideTip);
  });
}
function weekdayTable(A) {
  let r = '<table class="tbl"><thead><tr><th>Weekday</th><th>Average day-to-day spend</th></tr></thead><tbody>';
  for (const i of WD_ORDER) r += `<tr><td>${esc(weekdayName(i, 'long'))}</td><td>${money(niceRound(A.weekday[i]))}</td></tr>`;
  return r + '</tbody></table>';
}

/* calendar heatmap of daily spending (sequential ramp) */
function heatmapHTML(A) {
  const off = (parseYMD(A.p.start).getDay() + 6) % 7;
  const pos = A.daily.filter(v => v > 0).sort((a, b) => a - b);
  const q = [0.2, 0.4, 0.6, 0.8].map(f => (pos.length ? pos[Math.min(pos.length - 1, Math.floor(f * pos.length))] : 0));
  const level = v => (v <= 0 ? 0 : v <= q[0] ? 1 : v <= q[1] ? 2 : v <= q[2] ? 3 : v <= q[3] ? 4 : 5);
  let h = '<div class="hm" role="grid" aria-label="Spending per day">';
  for (const i of WD_ORDER) h += `<span class="hm-h" aria-hidden="true">${esc(weekdayName(i, 'narrow'))}</span>`;
  for (let i = 0; i < off; i++) h += '<span class="hm-pad" aria-hidden="true"></span>';
  for (let d = 0; d < A.p.days; d++) {
    const date = addDays(A.p.start, d), v = A.daily[d] || 0, fut = date > A.today;
    h += `<span class="hm-c l${fut ? 'f' : level(v)}" tabindex="0" data-date="${date}" data-v="${v}" aria-label="${esc(dayLabel(date))}: ${esc(money(v))}">${+date.slice(8)}</span>`;
  }
  h += '</div><div class="scale" aria-hidden="true"><span>Less</span>';
  for (let i = 1; i <= 5; i++) h += `<i class="hm-c l${i}"></i>`;
  return h + '<span>More</span></div>';
}
function bindHeatmap(root, A) {
  const grid = root.querySelector('.hm');
  if (!grid) return;
  const show = (t, x, y) => {
    const date = t.getAttribute('data-date'), v = +t.getAttribute('data-v');
    const n = A.entries.filter(e => e.date === date && kindOf(e) === 'spend').length;
    showTip(x, y, dayLabel(date), [{ label: n === 1 ? 'spent · 1 entry' : 'spent · ' + n + ' entries', value: money(v), color: 'var(--series-1)' }]);
  };
  grid.addEventListener('pointermove', ev => { const t = ev.target.closest('.hm-c'); if (t) show(t, ev.clientX, ev.clientY); else hideTip(); });
  grid.addEventListener('pointerdown', ev => { const t = ev.target.closest('.hm-c'); if (t) show(t, ev.clientX, ev.clientY); });
  grid.addEventListener('pointerleave', hideTip);
  grid.addEventListener('focusin', ev => { const t = ev.target.closest('.hm-c'); if (t) { const r = t.getBoundingClientRect(); show(t, r.left + r.width / 2, r.top); } });
  grid.addEventListener('focusout', hideTip);
}
