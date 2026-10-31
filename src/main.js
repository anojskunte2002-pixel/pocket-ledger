/* ===================== wiring + start-up ===================== */
function currentSlip(i) {
  const r = UI.draft;
  if (!r || r.kind !== 'entries' || !r.entries[i]) return null;
  return UI.slipOver[i] ? Object.assign({}, r.entries[i], UI.slipOver[i]) : r.entries[i];
}
const ACT = {
  'close-sheet': () => closeSheet(),
  tab: a => { closeSheet(true); setTab(a); },
  edit: a => { const e = Store.entries.get(a); if (e) openEditor(e); },
  'filter-cat': a => { UI.act = { q: '', type: 'all', cat: a }; UI.actLimit = 300; if (UI.mounted === 'activity') { const q = $('#act-q'); if (q) q.value = ''; } setTab('activity'); },
  'act-type': a => { UI.act.type = a; UI.actLimit = 300; updateActivity(); },
  'act-more': () => { UI.actLimit += 300; updateActivity(); },
  'act-clear': () => { UI.act = { q: '', type: 'all', cat: '' }; const q = $('#act-q'); if (q) q.value = ''; updateActivity(); },
  try: a => { closeSheet(true); const el = $('#entry'); el.value = a; onEntryInput(); el.focus(); },
  examples: () => loadExamples(),
  'clear-examples': () => { closeSheet(true); clearExamples(); },
  'focus-entry': () => { closeSheet(true); $('#entry').focus(); },
  voice: () => { closeSheet(true); toggleVoice(); },
  scan: () => { closeSheet(true); $('#file-img').click(); },
  'import-sms': () => openImport('sms'),
  'import-csv': () => { openImport('csv'); $('#file-csv').click(); },
  'open-import': () => openImport('sms'),
  'new-entry': () => openEditor(null),
  'new-repeat': () => openEditor({ repeat: 'monthly' }),
  person: a => setPerson(a),
  household: () => openHousehold(),
  'hh-two': a => { if (!HH) return; HH.two = a === '1'; if (!HH.two) HH.me = 'p1'; renderHousehold(); },
  'hh-me': a => { if (!HH) return; HH.me = a; setPicked('[data-act="hh-me"]', a); },
  'hh-save': () => householdSave(),
  appearance: () => openAppearance(),
  scene: a => { if (!sceneById(a)) return; savePrefs({ scene: a }); applyLook(); setPicked('.scene-tile', a, 'aria-pressed'); },
  fx: a => { savePrefs({ fx: a }); applyLook(); setPicked('[data-act="fx"]', a); },
  'tab-plan': () => { closeSheet(true); setTab('plan'); },
  'plan-item': a => openPlanItem(a),
  'plan-pay': a => planPay(a),
  'plan-edit': a => openPlanEditor('', a),
  'plan-new': a => openPlanEditor(a === 'income' ? 'income' : 'fixed'),
  'plan-new-fixed': () => openPlanEditor('fixed'),
  'plan-quick': a => { const p = String(a).split(':'), who = /^(p1|p2|joint)$/.test(p[3] || '') ? p[3] : ''; openPlanEditor(p[0] === 'income' ? 'income' : 'fixed', '', Object.assign({ cat: p[1] || '', name: p[2] || '' }, who ? { who } : {})); },
  'plan-goal': () => openGoalEditor(),
  'plan-suggest': () => openPlanSuggest(),
  'pe-cat': a => {
    if (!PE) return;
    PE.d.cat = a;
    setPicked('#pe-cats .cat-opt', a, 'aria-pressed');
    if (!PE.whoTouched && PE.d.kind === 'fixed' && !household().solo) { PE.d.who = isSharedCat(a) ? 'joint' : meId(); setPicked('[data-act="pe-who"]', PE.d.who); }
    const n = $('#pe-name'); if (n && !n.value.trim()) n.placeholder = catById(a).name;
  },
  'pe-who': a => { if (!PE) return; PE.d.who = a; PE.whoTouched = true; setPicked('[data-act="pe-who"]', a); },
  'pe-save': () => planEditorSave(),
  'pe-delete': async () => {
    if (!PE) return;
    const d = PE.d;
    closeSheet();
    try { await removePlanItem(d.id); } catch (e) { toast(storeErrorText(e)); return; }
    toast('Removed ' + d.name + ' from the plan', [{ label: 'Undo', run: () => upsertPlanItem(d).catch(err => toast(storeErrorText(err))) }], 6500);
  },
  'goal-pick': a => { const [w, v] = String(a).split(':'); const i = $('#goal-' + w); if (i) { i.value = v; i.focus(); } },
  'goal-save': () => goalSave(),
  'goal-remove': async () => { closeSheet(); try { await setPlanSave({ p1: 0, p2: 0 }); toast('Saving goals removed'); } catch (e) { toast(storeErrorText(e)); } },
  'ps-apply': () => planSuggestApply(),
  'slip-paid': a => {
    const i = +a, d = currentSlip(i);
    if (!d) return;
    const pp = entryPeople(d);
    UI.slipOver[i] = Object.assign({}, UI.slipOver[i], { paid: pp.paid === 'p1' ? 'p2' : 'p1' });
    renderSlips();
    $('#entry').focus();
  },
  'slip-for': a => {
    const i = +a, d = currentSlip(i);
    if (!d) return;
    const pp = entryPeople(d), other = pp.paid === 'p1' ? 'p2' : 'p1';
    const order = d.type === 'income' ? ['p1', 'p2', 'joint'] : [pp.paid, 'joint', other];
    UI.slipOver[i] = Object.assign({}, UI.slipOver[i], { who: order[(order.indexOf(pp.who) + 1) % 3] });
    renderSlips();
    $('#entry').focus();
  },
  'ed-paid': a => {
    if (!ED) return;
    ED.d.paid = a;
    if (!ED.whoTouched && ED.isNew && ED.d.who !== 'joint') ED.d.who = defaultWhoFor(ED.d.cat, a);
    $('#ed-people').innerHTML = edPeopleHTML(ED.d);
  },
  'ed-for': a => { if (!ED) return; ED.d.who = a; ED.whoTouched = true; $('#ed-people').innerHTML = edPeopleHTML(ED.d); },
  settle: () => openSettle(),
  'with-shared': () => { UI.withShared = !UI.withShared; uiFlag('with-shared', UI.withShared); if (UI.mounted === 'activity') updateActivity(); render(); },
  flow: a => openFlowSheet(a || 'all'),
  fair: a => openFairSheet(a),
  'balance-edit': a => openBalanceEditor(a),
  'balance-save': () => balanceSave(),
  'balance-remove': () => balanceRemove(),
  'settle-save': () => settleSave(),
  'hh-mode': a => { if (!HH) return; HH.mode = a; if (a === 'custom' && !(HH.split > 0)) HH.split = 0.5; renderHousehold(); },
  'hh-cat': (a, t) => { if (!HH) return; if (HH.cats.has(a)) HH.cats.delete(a); else HH.cats.add(a); t.setAttribute('aria-pressed', String(HH.cats.has(a))); },
  'slip-cat': a => {
    const i = +a, d = currentSlip(i);
    if (!d) return;
    openCatPicker(d.cat, id => { UI.slipOver[i] = Object.assign({}, UI.slipOver[i], { cat: id, type: catById(id).type, catLocked: true }); renderSlips(); $('#entry').focus(); });
  },
  'slip-edit': a => { const d = currentSlip(+a); if (d) openEditor(Object.assign({}, d, { source: 'text' }), { raw: d.raw }); },
  'toggle-table': a => { UI.tables[a] = !UI.tables[a]; updateInsights(); },
  'ask-sugg': a => askSubmit(a),
  'ask-stop': () => { if (UI.ask.ctl) UI.ask.ctl.abort(); },
  'ask-clear': () => { UI.ask = { turns: [], busy: false, ctl: null, live: '', err: '' }; renderAsk(); const q = $('#ask-q'); if (q) q.focus(); },
  review: () => runReview(false),
  'review-refresh': () => runReview(true),
  'review-stop': () => { if (UI.review.ctl) UI.review.ctl.abort(); },
  'open-permissions': () => openPermissions(),
  'hide-device-note': () => { uiFlag('device-note', true); renderBanner(); },
  'install-app': async () => { const ev = INSTALL_EVT; if (!ev) return; INSTALL_EVT = null; try { ev.prompt(); const r = await ev.userChoice; if (r && r.outcome === 'accepted') toast('Installed. Find Pocket Ledger with your apps.'); } catch (e) { /* dismissed */ } closeSheet(); },
  settings: () => openSettings(),
  'budget-edit': a => openBudgetEditor(a || ''),
  'budget-add': () => openBudgetAdd(),
  'budget-suggest': () => openBudgetSuggest(),
  'budget-save': a => budgetSave(a || ''),
  'budget-remove': a => budgetRemove(a || ''),
  'budget-apply': () => budgetApply(),
  'ed-type': a => {
    if (!ED) return;
    readEditor();
    ED.d.type = a;
    if (ED.d.cat && catById(ED.d.cat, a).type !== a) ED.d.cat = '';
    for (const b of $$('[data-act="ed-type"]')) b.setAttribute('aria-checked', String(b.dataset.arg === a));
    $('#ed-cats').innerHTML = catGridHTML(a, ED.d.cat);
    if (!ED.whoTouched) ED.d.who = a === 'income' ? ED.d.paid : defaultWhoFor(ED.d.cat, ED.d.paid);
    $('#ed-people').innerHTML = edPeopleHTML(ED.d);
  },
  'ed-cat': a => {
    if (!ED) return;
    ED.d.cat = a; ED.catTouched = true;
    setPicked('#ed-cats .cat-opt', a, 'aria-pressed');
    if (ED.isNew && !ED.whoTouched && !household().solo) { ED.d.who = defaultWhoFor(a, ED.d.paid); $('#ed-people').innerHTML = edPeopleHTML(ED.d); }
  },
  'ed-method': a => { if (!ED) return; ED.d.method = ED.d.method === a ? '' : a; for (const b of $$('#ed-methods .chip-btn')) b.setAttribute('aria-pressed', String(b.dataset.arg === ED.d.method)); },
  'ed-repeat': a => { if (!ED) return; ED.d.repeat = a; for (const b of $$('#ed-repeat .chip-btn')) b.setAttribute('aria-pressed', String(b.dataset.arg === a)); },
  'ed-save': () => editorSave(),
  'ed-delete': () => { if (!ED || !ED.orig) return; const e = ED.orig; closeSheet(); removeEntry(e); },
  'ed-duplicate': () => { if (!ED || !ED.orig) return; const d = readEditor(); const copy = Object.assign({}, d, { id: '', date: todayStr(), rec: '', repeat: '' }); delete copy.id; closeSheet(true); openEditor(copy); },
  'imp-tab': a => { IMP.tab = a; IMP.drafts = []; IMP.picked = []; IMP.dup = []; renderImport(); },
  'imp-read': () => importRead(),
  'imp-file': () => $('#file-csv').click(),
  'imp-json': () => $('#file-json').click(),
  'imp-sign': a => rerunCSV(a === 'exp'),
  'imp-all': () => { IMP.picked = IMP.drafts.map(() => true); renderImport(); },
  'imp-none': () => { IMP.picked = IMP.drafts.map(() => false); renderImport(); },
  'imp-save': () => importSave(),
  'imp-restore': () => restoreBackup(),
  'open-cats': () => openCategories(),
  'open-recurring': () => openRecurringManager(),
  'open-rules': () => openRulesManager(),
  'export-csv': () => offerFile('pocket-ledger-' + todayStr() + '.csv', buildCSV()),
  'export-json': () => offerFile('pocket-ledger-backup-' + todayStr() + '.json', buildBackup()),
  wipe: () => openWipe(),
  'wipe-go': async () => {
    closeSheet(true);
    try { await wipeAll(); } catch (e) { toast(storeErrorText(e)); return; }
    UI.ask = { turns: [], busy: false, ctl: null, live: '', err: '' };
    UI.review = { busy: false, text: '', err: '', ctl: null, key: '' };
    toast('Everything was deleted');
  },
  help: () => openHelp(),
  'cat-new': () => openCatEdit(''),
  'cat-edit': a => openCatEdit(a),
  'cat-save': () => saveCatEdit(),
  'cat-delete': a => deleteCat(a),
  'ce-type': a => {
    CE.type = a;
    for (const b of $$('[data-act="ce-type"]')) b.setAttribute('aria-checked', String(b.dataset.arg === a));
    const w = $('#ce-group-wrap'); if (w) w.hidden = a === 'income';
  },
  'rec-toggle': a => recToggle(a),
  'rec-delete': a => recDelete(a),
  'rule-forget': a => ruleForget(a),
  'copy-text': () => {
    const ta = $('#copy-text');
    if (!ta) return;
    const done = () => toast('Copied');
    const fallback = () => { ta.focus(); ta.select(); toast('Press Ctrl+C (or ⌘C) to copy the selected text'); };
    try { navigator.clipboard.writeText(ta.value).then(done, fallback); } catch (e) { fallback(); }
  }
};

function onPaste(ev) {
  const dt = ev.clipboardData;
  if (!dt) return;
  const img = Array.from(dt.files || []).find(f => /^image\//.test(f.type));
  if (img) { ev.preventDefault(); handleImage(img); return; }
  const text = dt.getData('text/plain') || '';
  if (text.split(/\n/).filter(l => l.trim()).length >= 3 && looksLikeBankMessage(text)) { ev.preventDefault(); openImport('sms', text); }
}
function onKey(ev) {
  if (ev.key === 'Escape') {
    if (SHEET.open) { ev.preventDefault(); closeSheet(); return; }
    if (Voice.on) { ev.preventDefault(); toggleVoice(); return; }
    hideTip(); hideCoach();
  }
  if (ev.key === 'Tab' && SHEET.open) {
    const sheet = $('#sheet-root .sheet');
    const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', sheet).filter(x => !x.disabled && !x.hidden && x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!sheet.contains(document.activeElement)) { ev.preventDefault(); first.focus(); }
    else if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    return;
  }
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (ev.key === '/' && !SHEET.open && !/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) { ev.preventDefault(); $('#entry').focus(); }
}
function rotatePlaceholder() {
  const el = $('#entry');
  let i = 0;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) setInterval(() => { if (UI.capOpen && !el.value && document.activeElement !== el && !document.hidden) { const ex = exampleTry(); el.placeholder = 'Try “' + ex[++i % ex.length] + '”'; } }, 4500);
}
function bindChrome() {
  document.addEventListener('click', ev => {
    const t = ev.target.closest('[data-act]');
    if (!t || t.disabled) return;
    const fn = ACT[t.dataset.act];
    if (!fn) return;
    ev.preventDefault();
    fn(t.dataset.arg != null ? t.dataset.arg : '', t, ev);
  });
  for (const b of $$('.tabs [data-tab]')) b.addEventListener('click', () => setTab(b.dataset.tab));
  const top = $('#top');
  const onScroll = () => { const s = window.scrollY > 6; if (top.classList.contains('scrolled') !== s) { top.classList.toggle('scrolled', s); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', ev => {
      const g = ev.target && ev.target.closest && ev.target.closest('button.glass, .hero');
      if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', Math.round(ev.clientX - r.left) + 'px');
      g.style.setProperty('--my', Math.round(ev.clientY - r.top) + 'px');
    }, { passive: true });
  }
  $('#prev-period').addEventListener('click', () => shiftPeriod(-1));
  $('#next-period').addEventListener('click', () => shiftPeriod(1));
  $('#period-label').addEventListener('click', () => { UI.period = currentKey(); UI.periodTouched = false; render(); });
  $('#open-settings').addEventListener('click', () => openSettings());
  $('#add-btn').addEventListener('click', () => openAddHub());
  $('#mic-btn').addEventListener('click', () => toggleVoice());
  $('#capture').addEventListener('submit', ev => { ev.preventDefault(); submitEntry(); });
  const entry = $('#entry');
  entry.addEventListener('input', onEntryInput);
  entry.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); submitEntry(); }
    else if (ev.key === 'Escape') { if (UI.aiCtl) UI.aiCtl.abort(); else if (!entry.value.trim()) entry.blur(); }
  });
  entry.addEventListener('paste', onPaste);
  entry.addEventListener('focus', () => setCapOpen(true));
  entry.addEventListener('blur', () => setTimeout(maybeCloseCap, 160));
  document.addEventListener('paste', ev => {
    const tag = (ev.target && ev.target.tagName) || '';
    if (/^(INPUT|TEXTAREA)$/.test(tag) || SHEET.open) return;
    const img = Array.from((ev.clipboardData && ev.clipboardData.files) || []).find(f => /^image\//.test(f.type));
    if (img) { ev.preventDefault(); handleImage(img); }
  });
  $('#file-img').addEventListener('change', ev => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (f) handleImage(f); });
  $('#file-csv').addEventListener('change', ev => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return; if (!SHEET.open || !$('#imp-body')) openImport('csv'); IMP.tab = 'csv'; readCSVFile(f); });
  $('#file-json').addEventListener('change', ev => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return; if (!SHEET.open || !$('#imp-body')) openImport('backup'); IMP.tab = 'backup'; readBackupFile(f); });
  document.addEventListener('dragover', ev => { if (ev.dataTransfer && Array.from(ev.dataTransfer.types || []).indexOf('Files') >= 0) ev.preventDefault(); });
  document.addEventListener('drop', ev => {
    const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (!f) return;
    ev.preventDefault();
    if (/^image\//.test(f.type)) handleImage(f);
    else if (/\.json$/i.test(f.name)) { openImport('backup'); readBackupFile(f); }
    else if (/\.(csv|txt)$/i.test(f.name) || /csv|text\/plain/.test(f.type)) { openImport('csv'); readCSVFile(f); }
    else toast('Drop a receipt photo, a CSV statement or a backup file');
  });
  document.addEventListener('keydown', onKey);
  window.addEventListener('beforeinstallprompt', ev => { ev.preventDefault(); INSTALL_EVT = ev; });
  window.addEventListener('appinstalled', () => { INSTALL_EVT = null; });
  window.addEventListener('hashchange', () => { const h = tabFromHash(location.hash); if (h && h !== UI.tab) setTab(h); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Store.ready) { materializeRecurring(); materializePlan(); render(); } });
  window.addEventListener('scroll', hideTip, { passive: true });
  document.addEventListener('pointerdown', ev => { if (!ev.target.closest('.chart, .hm')) hideTip(); });
  if (typeof ResizeObserver === 'function') {
    let lastW = 0, raf = 0;
    const ro = new ResizeObserver(() => {
      updateDockHeight();
      const w = $('#view').clientWidth;
      if (w !== lastW) {
        lastW = w;
        if (!Store.ready) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          if (UI.mounted === 'insights') drawCharts(analyze(UI.period, viewKey()));
          for (const el of $$('#view .chart[data-chart="flow"]')) flowChart(el, analyze(UI.period, el.dataset.view && el.dataset.view !== 'all' ? el.dataset.view + 's' : 'all'));
          refractNow();
        });
      }
    });
    ro.observe($('#view'));
    ro.observe($('#dock'));
  }
}
const TABS = ['home', 'activity', 'plan', 'insights'];
function tabFromHash(h) { h = String(h || '').replace(/^#/, ''); if (h === 'budgets') h = 'plan'; return TABS.indexOf(h) >= 0 ? h : ''; }
/* your scene and glass, applied before anything else paints */
function applyLook() {
  applyScene(currentSceneId(), Prefs.motion && Prefs.fx !== 'saver');
  initGlass(Prefs.fx);
}
async function settleMe() {
  const before = currentSceneId(), fxBefore = Prefs.fx, motionBefore = Prefs.motion;
  await loadCloudPrefs();
  if (!Prefs.me && Store.mode === 'cloud') await savePrefs({ me: Store.isOwner ? 'p1' : 'p2' });
  if (currentSceneId() !== before || Prefs.fx !== fxBefore || Prefs.motion !== motionBefore) applyLook();
}
function boot(hot) {
  hot = hot || {};
  setCurrency(settings().currency);
  loadLocalPrefs();
  applyScene(currentSceneId(), Prefs.motion && Prefs.fx !== 'saver');
  if (bgInit() && BG.live) bgStart();
  initGlass(Prefs.fx);
  bindChrome();
  UI.tab = tabFromHash(location.hash) || tabFromHash(hot.tab) || 'home';
  if (hot.draft) $('#entry').value = String(hot.draft);
  rotatePlaceholder();
  autosize();
  syncDockButtons();
  storeOnChange(render);
  render();
  initStore().then(async () => {
    render();
    await settleMe();
    render();
    materializeRecurring();
    materializePlan();
    if ($('#entry').value) onEntryInput();
  });
  initAI();
  const c = window.claude;
  if (c && typeof c.use === 'function') {
    c.use('downloads').then(d => { UI.downloads = d; }).catch(() => {});
    c.use('permissions').then(p => { UI.permissions = p; }).catch(() => {});
  }
  try { if (c && c.hot && typeof c.hot.snapshot === 'function') c.hot.snapshot(() => ({ draft: $('#entry').value, tab: UI.tab })); } catch (e) { /* optional */ }
}
(function start() {
  const hot = window.claude && window.claude.hot;
  if (hot && typeof hot.ready === 'function') hot.ready(boot);
  else boot(hot && hot.data ? hot.data : {});
})();
