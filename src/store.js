/* ===================== store: private cloud (db capability) or this device ===================== */
const LS_PREFIX = 'pocketledger:v1:';
const BUCKET_LIMIT = 200000;      // bytes; a month document stays below the 256 KiB cap
const META_NAMES = ['settings', 'budgets', 'categories', 'rules', 'recurring', 'household', 'plan', 'balances'];

const Store = {
  mode: 'loading',                 // cloud | device | memory
  reason: '',                      // why we are not in the cloud
  db: null,
  uid: null,
  isOwner: true,
  buckets: new Map(),              // bucketId → { entries: { id: doc | null } }
  sizes: new Map(),
  meta: { settings: null, budgets: null, categories: null, rules: null, recurring: null, household: null, plan: null, balances: null },
  metaPending: {},
  entries: new Map(),
  where: new Map(),
  pending: new Map(),              // id → { entry | null, bucket, done }
  queues: new Map(),
  version: 0,
  ready: false,
  metaLoaded: false,
  readOnly: false,
  error: '',
  listeners: new Set(),
  unsubs: []
};

function normEntry(id, e) {
  const type = e.type === 'income' ? 'income' : 'expense';
  return {
    id, type,
    amount: round2(Math.abs(+e.amount) || 0),
    cat: String(e.cat || (type === 'income' ? 'other_in' : 'other')),
    date: isYMD(e.date) ? e.date : todayStr(),
    note: String(e.note || '').slice(0, 120),
    merchant: String(e.merchant || '').slice(0, 60),
    method: String(e.method || ''),
    tags: Array.isArray(e.tags) ? e.tags.slice(0, 8).map(String) : [],
    source: String(e.source || 'text'),
    rec: e.rec ? String(e.rec) : '',
    who: e.who ? String(e.who).slice(0, 20) : '',
    paid: e.paid === 'p1' || e.paid === 'p2' ? e.paid : '',
    by: e.by ? String(e.by).slice(0, 20) : '',
    plan: e.plan ? String(e.plan).slice(0, 40) : '',
    sample: !!e.sample,
    created: +e.created || 0,
    updated: +e.updated || +e.created || 0
  };
}
function entryToDoc(e) {
  return { type: e.type, amount: e.amount, cat: e.cat, date: e.date, note: e.note, merchant: e.merchant, method: e.method, tags: e.tags, source: e.source, rec: e.rec, who: e.who, paid: e.paid, by: e.by, plan: e.plan, sample: e.sample, created: e.created, updated: e.updated };
}

function storeOnChange(fn) { Store.listeners.add(fn); }
function storeEmit() { Store.version++; for (const fn of Store.listeners) { try { fn(); } catch (e) { console.error(e); } } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
function enqueue(key, fn) {
  const prev = Store.queues.get(key) || Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  Store.queues.set(key, next);
  return next;
}

/* ---------- local storage helpers ---------- */
function lsGet(k) { try { const v = localStorage.getItem(LS_PREFIX + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function lsDel(k) { try { localStorage.removeItem(LS_PREFIX + k); } catch (e) { /* ignore */ } }
function lsKeys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(LS_PREFIX) === 0) out.push(k.slice(LS_PREFIX.length)); } } catch (e) { /* ignore */ } return out; }
function lsWorks() { try { localStorage.setItem(LS_PREFIX + 'probe', '1'); localStorage.removeItem(LS_PREFIX + 'probe'); return true; } catch (e) { return false; } }

/* ---------- rebuild the entry map from documents + in-flight writes ---------- */
function rebuildEntries() {
  const map = new Map(), where = new Map();
  for (const [bid, b] of Store.buckets) {
    const ents = b && b.entries;
    if (!ents || typeof ents !== 'object') continue;
    for (const id of Object.keys(ents)) {
      const v = ents[id];
      if (!v || typeof v !== 'object') continue;
      const n = normEntry(id, v);
      const prev = map.get(id);
      if (!prev || n.updated >= prev.updated) { map.set(id, n); where.set(id, bid); }
    }
  }
  const now = Date.now();
  for (const [id, p] of Store.pending) {
    const server = map.get(id);
    const settled = p.entry ? !!(server && server.updated >= p.entry.updated) : !server;
    if (p.done && (settled || now - p.done > 20000)) { Store.pending.delete(id); continue; }
    if (p.entry) { map.set(id, p.entry); where.set(id, p.bucket); } else map.delete(id);
  }
  Store.entries = map;
  Store.where = where;
}
function applyMetaSnapshot(server) {
  const out = {};
  for (const n of META_NAMES) {
    const p = Store.metaPending[n];
    const s = server[n] || null;
    if (p && (((s && s.rev) || '') === p.rev || (p.done && Date.now() - p.done > 20000))) delete Store.metaPending[n];
    out[n] = Store.metaPending[n] ? Store.metaPending[n].data : s;
  }
  Store.meta = out;
}

/* ---------- start-up ---------- */
async function initStore() {
  let db = null, user = null;
  const c = typeof window !== 'undefined' ? window.claude : null;
  if (c && typeof c.use === 'function') {
    const r = await Promise.all([c.use('db').catch(() => null), c.use('user').catch(() => null)]);
    db = r[0]; user = r[1];
  }
  if (db) {
    let owner = true;
    if (user && typeof user.isOwner === 'function') owner = await user.isOwner().catch(() => true);
    if (user && typeof user.id === 'function') Store.uid = await user.id().catch(() => null);
    Store.isOwner = owner;
    let canWrite = null;
    if (!owner && user && typeof user.can === 'function') canWrite = await user.can('data.write').catch(() => null);
    if (!owner && canWrite !== true && user && typeof user.canEdit === 'function') canWrite = (await user.canEdit().catch(() => false)) === true ? true : canWrite;
    const probe = owner || canWrite === true ? true : await db.doc('meta/household').get().then(sn => sn.exists, () => false);
    if (owner || probe) {
      Store.db = db; Store.mode = 'cloud';
      const ok = await subscribeCloud(db);
      if (!ok && !Store.ready) { Store.error = 'Still connecting to your saved ledger…'; }
      Store.ready = true; rebuildEntries(); storeEmit();
      return;
    }
    Store.reason = 'no-access';
  } else Store.reason = c ? 'signed-out' : 'standalone';
  if (lsWorks()) { Store.mode = 'device'; loadDevice(); window.addEventListener('storage', ev => { if (ev.key && ev.key.indexOf(LS_PREFIX) === 0) { loadDevice(); storeEmit(); } }); }
  else Store.mode = 'memory';
  Store.ready = true; rebuildEntries(); storeEmit();
}
function subscribeCloud(db) {
  return new Promise(resolve => {
    let gotL = false, gotM = false, done = false;
    const finish = () => { if (!done && gotL && gotM) { done = true; resolve(true); } };
    const onErr = e => {
      const code = e && e.code;
      if (code === 'revoked' || code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed') { Store.readOnly = true; Store.error = 'Access to your saved ledger changed. Reload the page to continue.'; }
      else if (code === 'unavailable') { Store.error = 'Lost the connection to your saved ledger. Reload to reconnect.'; }
      else Store.error = 'Your saved ledger could not be read (' + (code || 'error') + ').';
      if (!done) { done = true; resolve(false); }
      storeEmit();
    };
    Store.unsubs.push(db.collection('ledger').onSnapshot(snap => {
      Store.buckets = new Map();
      Store.sizes = new Map();
      for (const d of snap.docs) {
        const data = d.data();
        if (!data) continue;
        Store.buckets.set(d.id, data);
        try { Store.sizes.set(d.id, JSON.stringify(data).length); } catch (e) { Store.sizes.set(d.id, 0); }
      }
      rebuildEntries();
      gotL = true; finish();
      if (Store.ready) storeEmit();
    }, onErr));
    Store.unsubs.push(db.collection('meta').onSnapshot(snap => {
      const server = {};
      for (const d of snap.docs) server[d.id] = d.data() || null;
      applyMetaSnapshot(server);
      Store.metaLoaded = true;
      gotM = true; finish();
      if (Store.ready) storeEmit();
    }, onErr));
    setTimeout(() => { if (!done) { done = true; resolve(false); } }, 12000);
  });
}
function loadDevice() {
  Store.buckets = new Map(); Store.sizes = new Map();
  for (const k of lsKeys()) {
    if (k.indexOf('ledger:') === 0) {
      const v = lsGet(k);
      if (v && v.entries) { Store.buckets.set(k.slice(7), v); Store.sizes.set(k.slice(7), JSON.stringify(v).length); }
    }
  }
  const m = {};
  for (const n of META_NAMES) m[n] = lsGet('meta:' + n);
  Store.meta = m;
  Store.metaLoaded = true;
  rebuildEntries();
}

/* ---------- writes ---------- */
function bucketFor(e) {
  const base = monthOf(e.date);
  const cur = Store.where.get(e.id);
  if (cur && cur.split('_')[0] === base) return cur;
  let k = base, n = 1;
  while ((Store.sizes.get(k) || 0) > BUCKET_LIMIT) { n++; k = base + '_' + n; }
  return k;
}
async function writeBucket(bid, patch) {
  if (Store.mode !== 'cloud') {
    const b = Store.buckets.get(bid) || { entries: {} };
    const copy = { entries: Object.assign({}, b.entries) };
    for (const id in patch) { if (patch[id]) copy.entries[id] = patch[id]; else delete copy.entries[id]; }
    if (Object.keys(copy.entries).length) { Store.buckets.set(bid, copy); if (Store.mode === 'device' && !lsSet('ledger:' + bid, copy)) throw { code: 'quota_exceeded' }; }
    else { Store.buckets.delete(bid); lsDel('ledger:' + bid); }
    Store.sizes.set(bid, JSON.stringify(copy).length);
    return;
  }
  const ref = Store.db.doc('ledger/' + bid);
  return enqueue('ledger/' + bid, async () => {
    const attempt = async () => {
      if (Store.buckets.has(bid)) return ref.update({ entries: patch });
      const snap = await ref.get();
      if (snap.exists) return ref.update({ entries: patch });
      return ref.set({ entries: patch, v: 1 });
    };
    try { await attempt(); }
    catch (e) {
      if (!e || (e.code !== 'unavailable' && e.code !== 'invalid_argument')) throw e;
      await sleep(300 + Math.random() * 700);
      const snap = await ref.get();
      if (snap.exists) await ref.update({ entries: patch }); else await ref.set({ entries: patch, v: 1 });
    }
  });
}
async function commitPatches(patches, ids) {
  try {
    await Promise.all(Array.from(patches.entries()).map(([bid, p]) => writeBucket(bid, p)));
    const now = Date.now();
    for (const id of ids) { const p = Store.pending.get(id); if (p) p.done = now; }
    rebuildEntries(); storeEmit();
    return true;
  } catch (e) {
    for (const id of ids) Store.pending.delete(id);
    rebuildEntries(); storeEmit();
    throw e;
  }
}
function addPatch(patches, bid, id, doc) { if (!patches.has(bid)) patches.set(bid, {}); patches.get(bid)[id] = doc; }
async function putEntries(list) {
  if (Store.readOnly) throw { code: 'read_only' };
  const patches = new Map(), ids = [];
  for (const e of list) {
    const target = bucketFor(e);
    const cur = Store.where.get(e.id);
    if (cur && cur !== target) addPatch(patches, cur, e.id, null);
    const doc = entryToDoc(e);
    addPatch(patches, target, e.id, doc);
    Store.where.set(e.id, target);
    Store.sizes.set(target, (Store.sizes.get(target) || 0) + JSON.stringify(doc).length + e.id.length + 6);
    if (Store.mode === 'cloud') Store.pending.set(e.id, { entry: e, bucket: target, done: 0 });
    ids.push(e.id);
  }
  if (Store.mode === 'cloud') { rebuildEntries(); storeEmit(); }
  return commitPatches(patches, ids);
}
async function deleteEntries(idList) {
  if (Store.readOnly) throw { code: 'read_only' };
  const patches = new Map(), ids = [];
  for (const id of idList) {
    const bid = Store.where.get(id);
    if (!bid) continue;
    addPatch(patches, bid, id, null);
    if (Store.mode === 'cloud') Store.pending.set(id, { entry: null, bucket: bid, done: 0 });
    ids.push(id);
  }
  if (!ids.length) return true;
  if (Store.mode === 'cloud') { rebuildEntries(); storeEmit(); }
  return commitPatches(patches, ids);
}
async function metaReady() {
  if (Store.mode !== 'cloud' || Store.metaLoaded) return;
  for (let i = 0; i < 60 && !Store.metaLoaded; i++) await sleep(250);
  if (!Store.metaLoaded) throw { code: 'unavailable' };
}
async function putMeta(name, data) {
  if (Store.readOnly) throw { code: 'read_only' };
  await metaReady();
  const doc = Object.assign({}, data, { rev: uid('v') });
  if (Store.mode === 'cloud') {
    Store.metaPending[name] = { data: doc, rev: doc.rev, done: 0 };
    Store.meta = Object.assign({}, Store.meta, { [name]: doc });
    storeEmit();
    try { await enqueue('meta/' + name, () => Store.db.doc('meta/' + name).set(doc)); if (Store.metaPending[name]) Store.metaPending[name].done = Date.now(); }
    catch (e) { delete Store.metaPending[name]; throw e; }
  } else {
    Store.meta = Object.assign({}, Store.meta, { [name]: doc });
    if (Store.mode === 'device' && !lsSet('meta:' + name, doc)) throw { code: 'quota_exceeded' };
    storeEmit();
  }
}
async function wipeAll() {
  if (Store.mode === 'cloud') {
    for (const bid of Array.from(Store.buckets.keys())) await enqueue('ledger/' + bid, () => Store.db.doc('ledger/' + bid).delete());
    for (const n of META_NAMES) await enqueue('meta/' + n, () => Store.db.doc('meta/' + n).delete());
  } else {
    for (const k of lsKeys()) lsDel(k);
  }
  Store.buckets = new Map(); Store.sizes = new Map(); Store.pending.clear(); Store.metaPending = {};
  Store.meta = { settings: null, budgets: null, categories: null, rules: null, recurring: null, household: null, plan: null, balances: null };
  Store.metaLoaded = Store.mode !== 'cloud';
  rebuildEntries(); storeEmit();
}

/* ---------- per-person preferences: which member you are, your background ---------- */
const Prefs = { me: '', scene: '', motion: true, fx: 'frosted', loaded: false };
function sanitizePrefs(p) {
  const out = {};
  if (!p || typeof p !== 'object') return out;
  if (typeof p.me === 'string' && /^(?:p1|p2)$/.test(p.me)) out.me = p.me;
  if (typeof p.scene === 'string' && /^[a-z]{2,20}$/.test(p.scene)) out.scene = p.scene;
  if (typeof p.motion === 'boolean') out.motion = p.motion;
  // edge refraction ("liquid") is opt-in: it is heavy on phones. The old default "full" reads as frosted.
  if (p.fx === 'liquid' || p.fx === 'frosted' || p.fx === 'saver') out.fx = p.fx;
  else if (p.fx === 'full') out.fx = 'frosted';
  return out;
}
function loadLocalPrefs() { Object.assign(Prefs, sanitizePrefs(lsGet('prefs'))); }
async function loadCloudPrefs() {
  if (Store.mode !== 'cloud' || !Store.uid || !Store.db) return false;
  try {
    const snap = await Store.db.doc('data/users/' + Store.uid + '/prefs').get();
    if (snap.exists) { Object.assign(Prefs, sanitizePrefs(snap.data())); lsSet('prefs', sanitizePrefs(Prefs)); return true; }
  } catch (e) { /* the device copy is enough */ }
  return false;
}
async function savePrefs(patch) {
  Object.assign(Prefs, sanitizePrefs(patch));
  const clean = sanitizePrefs(Prefs);
  lsSet('prefs', clean);
  if (Store.mode === 'cloud' && Store.uid && Store.db) {
    try { await enqueue('prefs', () => Store.db.doc('data/users/' + Store.uid + '/prefs').set(clean)); } catch (e) { /* kept on this device */ }
  }
}
