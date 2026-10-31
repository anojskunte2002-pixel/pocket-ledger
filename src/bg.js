/* ===================== living backgrounds: one WebGL shader, eight scenes, chosen per person ===================== */
const SCENES = [
  { id: 'aurora', name: 'Aurora', tone: 'dark', mode: 1, warp: 1.2, grain: 0.035, speed: 1, colors: ['#02050f', '#0a1f3d', '#19e3a7', '#6a5cff', '#ff4fae'], accent: '#7cf2cf' },
  { id: 'sunrise', name: 'Sunrise', tone: 'light', mode: 0, warp: 1.8, grain: 0.03, speed: 1, colors: ['#ffe4cc', '#ff9a6b', '#ff5c8f', '#ffc561', '#ff86de'], accent: '#7a2fd0' },
  { id: 'ocean', name: 'Deep Ocean', tone: 'dark', mode: 3, warp: 1, grain: 0.03, speed: 1, colors: ['#010b17', '#04305c', '#0a84ff', '#26d9ff', '#9ff8ff'], accent: '#5fd3ff' },
  { id: 'neon', name: 'Neon Nights', tone: 'dark', mode: 0, warp: 2.4, grain: 0.04, speed: 1.2, colors: ['#08021c', '#2a0d63', '#ff2fb9', '#3cd5ff', '#ff8a00'], accent: '#ff7ad9' },
  { id: 'lava', name: 'Lava Lamp', tone: 'dark', mode: 2, warp: 1, grain: 0.035, speed: 1, colors: ['#140306', '#3d0612', '#ff3d2e', '#ff9e1b', '#ff5fa2'], accent: '#ffb067' },
  { id: 'holo', name: 'Holographic', tone: 'light', mode: 0, warp: 1.5, grain: 0.025, speed: 0.8, colors: ['#f4f0ff', '#b9e4ff', '#ffc6ec', '#c6ffe2', '#fff0b3'], accent: '#6b4dff' },
  { id: 'forest', name: 'Rainforest', tone: 'dark', mode: 1, warp: 1, grain: 0.035, speed: 0.9, colors: ['#010a06', '#06301f', '#2fd67a', '#c6f35b', '#16b5a8'], accent: '#a6f58a' },
  { id: 'cosmos', name: 'Cosmos', tone: 'dark', mode: 2, warp: 1, grain: 0.04, speed: 0.8, colors: ['#03020b', '#120a38', '#7a4bff', '#ff5fcf', '#43d9ff'], accent: '#c2adff' }
];
function sceneById(id) { return SCENES.find(s => s.id === id) || null; }
/* each person starts on a different scene, so the two phones never look alike */
function defaultScene(who) {
  let dark = true;
  try { dark = !window.matchMedia('(prefers-color-scheme: light)').matches; } catch (e) { /* assume dark */ }
  if (who === 'p2') return dark ? 'cosmos' : 'holo';
  return dark ? 'aurora' : 'sunrise';
}
function sceneCSS(sc) {
  const c = sc.colors;
  return 'radial-gradient(60% 45% at 18% 22%, ' + c[2] + 'cc, transparent 70%), radial-gradient(55% 45% at 82% 30%, ' + c[3] + 'b3, transparent 70%), ' +
    'radial-gradient(70% 55% at 50% 92%, ' + c[4] + '99, transparent 72%), linear-gradient(180deg, ' + c[1] + ', ' + c[0] + ')';
}

const BG_VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const BG_FRAG = [
  'precision mediump float;',
  'uniform vec2 uRes; uniform float uTime; uniform float uMode; uniform float uWarp; uniform float uGrain;',
  'uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3; uniform vec3 c4;',
  'float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
  'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);',
  '  return mix(mix(h21(i), h21(i+vec2(1.0,0.0)), u.x), mix(h21(i+vec2(0.0,1.0)), h21(i+vec2(1.0,1.0)), u.x), u.y); }',
  'float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++){ v += a*noise(p); p = m*p; a *= 0.5; } return v; }',
  'void main(){',
  '  vec2 uv = gl_FragCoord.xy/uRes; float asp = uRes.x/uRes.y; vec2 p = vec2(uv.x*asp, uv.y); float t = uTime; vec3 col;',
  '  if (uMode < 0.5) {',
  '    vec2 q = vec2(fbm(p*1.3 + vec2(0.0, t*0.06)), fbm(p*1.3 + vec2(3.1, -t*0.05)));',
  '    vec2 r = vec2(fbm(p*1.7 + uWarp*q + vec2(1.7, 9.2) + t*0.04), fbm(p*1.7 + uWarp*q + vec2(8.3, 2.8) - t*0.035));',
  '    float f = fbm(p*1.2 + uWarp*r);',
  '    col = mix(c0, c1, smoothstep(0.15, 0.75, f));',
  '    col = mix(col, c2, smoothstep(0.35, 0.95, r.x));',
  '    col = mix(col, c3, smoothstep(0.45, 1.0, q.y*0.9 + f*0.4));',
  '    col = mix(col, c4, smoothstep(0.62, 0.98, r.y*0.7 + f*0.5)*0.85);',
  '  } else if (uMode < 1.5) {',
  '    col = mix(c0, c1, smoothstep(0.0, 1.0, uv.y));',
  '    for (int i = 0; i < 3; i++) {',
  '      float fi = float(i);',
  '      float wave = 0.66 - fi*0.13 + 0.08*sin(p.x*1.3 + t*0.12 + fi*1.7) + 0.06*sin(p.x*2.7 - t*0.17 + fi) + 0.12*(fbm(vec2(p.x*1.6 + fi*3.0, t*0.05)) - 0.5);',
  '      float d = uv.y - wave;',
  '      float curtain = exp(-d*d*120.0)*0.9 + smoothstep(0.0, 0.3, d)*exp(-d*6.0)*0.8;',
  '      float streak = 0.5 + 0.5*fbm(vec2(p.x*16.0 + fi*7.0, t*0.22 + fi));',
  '      vec3 cc = fi < 0.5 ? c2 : (fi < 1.5 ? c3 : c4);',
  '      col += cc*curtain*streak*(0.85 - fi*0.17);',
  '    }',
  '    col += vec3(step(0.9976, h21(floor(gl_FragCoord.xy*0.6))))*smoothstep(0.45, 1.0, uv.y)*0.8;',
  '  } else if (uMode < 2.5) {',
  '    float field = 0.0; vec3 acc = vec3(0.0); float wsum = 0.0;',
  '    for (int i = 0; i < 6; i++) {',
  '      float fi = float(i);',
  '      vec2 ctr = vec2(asp*(0.5 + 0.38*sin(t*0.11*(1.0 + fi*0.17) + fi*1.9)), 0.5 + 0.36*cos(t*0.09*(1.0 + fi*0.13) + fi*2.3));',
  '      float rad = 0.2 + 0.05*sin(fi*3.1 + t*0.2);',
  '      float dd = length(p - ctr);',
  '      float w = rad*rad/(dd*dd + 0.002);',
  '      field += w;',
  '      float m3 = mod(fi, 3.0);',
  '      vec3 cc = m3 < 0.5 ? c2 : (m3 < 1.5 ? c3 : c4);',
  '      acc += cc*w; wsum += w;',
  '    }',
  '    vec3 blob = acc/max(wsum, 0.0001);',
  '    col = mix(mix(c0, c1, uv.y), blob, smoothstep(0.9, 1.6, field));',
  '    col += blob*smoothstep(1.4, 4.0, field)*0.25;',
  '  } else {',
  '    col = mix(c1, c0, uv.y);',
  '    for (int i = 0; i < 5; i++) {',
  '      float fi = float(i);',
  '      float wv = 0.12 + fi*0.15 + 0.05*sin(p.x*(2.0 + fi*0.7) + t*(0.25 + fi*0.06) + fi*1.3) + 0.03*sin(p.x*5.0 - t*0.4 + fi);',
  '      float band = smoothstep(wv + 0.015, wv - 0.015, uv.y);',
  '      col = mix(col, mix(c2, c3, fi/4.0)*(0.5 + 0.08*fi), band*0.32);',
  '      col += c4*exp(-pow((uv.y - wv)*70.0, 2.0))*0.3;',
  '    }',
  '    col += c4*pow(smoothstep(0.55, 0.85, fbm(p*6.0 + vec2(t*0.2, -t*0.15))), 3.0)*0.2*(1.0 - uv.y);',
  '  }',
  '  vec2 vc = uv - 0.5; col *= 1.0 - dot(vc, vc)*0.5;',
  '  col += (h21(gl_FragCoord.xy + fract(t)*100.0) - 0.5)*uGrain;',
  '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
  '}'
].join('\n');

const BG = { gl: null, cv: null, u: {}, scene: SCENES[0], raf: 0, start: 0, offset: 7, t: 7, frame: 0, live: true, scale: 0.5 };
function reducedMotion() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
function bgInit() {
  const cv = document.getElementById('bg');
  if (!cv) return false;
  let gl = null;
  try { gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
  if (!gl) { cv.hidden = true; return false; }
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = compile(gl.VERTEX_SHADER, BG_VERT), fs = compile(gl.FRAGMENT_SHADER, BG_FRAG);
  if (!vs || !fs) { cv.hidden = true; return false; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.hidden = true; return false; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  for (const n of ['uRes', 'uTime', 'uMode', 'uWarp', 'uGrain', 'c0', 'c1', 'c2', 'c3', 'c4']) BG.u[n] = gl.getUniformLocation(prog, n);
  BG.gl = gl; BG.cv = cv;
  cv.addEventListener('webglcontextlost', ev => { ev.preventDefault(); bgStop(); BG.gl = null; cv.hidden = true; });
  window.addEventListener('resize', bgResize, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) bgStop(); else bgStart(); });
  bgResize();
  return true;
}
function bgResize() {
  if (!BG.gl) return;
  const w = Math.max(2, Math.round(window.innerWidth * BG.scale)), h = Math.max(2, Math.round(window.innerHeight * BG.scale));
  if (BG.cv.width !== w || BG.cv.height !== h) { BG.cv.width = w; BG.cv.height = h; BG.gl.viewport(0, 0, w, h); }
  bgDraw(BG.t);
}
function bgDraw(t) {
  const gl = BG.gl;
  if (!gl) return;
  const s = BG.scene;
  gl.uniform2f(BG.u.uRes, BG.cv.width, BG.cv.height);
  gl.uniform1f(BG.u.uTime, t);
  gl.uniform1f(BG.u.uMode, s.mode);
  gl.uniform1f(BG.u.uWarp, s.warp);
  gl.uniform1f(BG.u.uGrain, s.grain);
  s.colors.forEach((c, i) => { const v = hexRgb(c); gl.uniform3f(BG.u['c' + i], v[0], v[1], v[2]); });
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
function bgLoop(now) {
  BG.raf = requestAnimationFrame(bgLoop);
  if (now - BG.frame < 40) return;
  BG.frame = now;
  BG.t = BG.offset + (now - BG.start) / 1000 * BG.scene.speed;
  bgDraw(BG.t);
}
function bgStart() {
  if (!BG.gl || BG.raf || !BG.live || document.hidden) return;
  BG.start = performance.now(); BG.offset = BG.t; BG.frame = 0;
  BG.raf = requestAnimationFrame(bgLoop);
}
function bgStop() { if (BG.raf) cancelAnimationFrame(BG.raf); BG.raf = 0; }
function applyScene(id, live) {
  const sc = sceneById(id) || sceneById(defaultScene());
  const changed = BG.scene !== sc;
  BG.scene = sc;
  const body = document.body;
  body.classList.toggle('tone-light', sc.tone === 'light');
  body.classList.toggle('tone-dark', sc.tone !== 'light');
  body.style.setProperty('--scene-accent', sc.accent);
  body.style.setProperty('--scene-base', sc.colors[0]);
  const fb = document.getElementById('bg-fallback');
  if (fb) fb.style.background = sceneCSS(sc);
  const tc = document.querySelector('meta[name="theme-color"]:not([media])');
  if (tc) tc.setAttribute('content', sc.colors[1]);
  BG.live = live !== false && !reducedMotion();
  if (BG.gl) { if (changed) bgDraw(BG.t); if (BG.live) bgStart(); else { bgStop(); bgDraw(BG.t); } }
}

/* liquid glass: real refraction where the browser supports SVG filters on the backdrop (Chromium).
   Each glass surface gets a displacement map shaped like its own rounded rectangle: the rim bends
   what is behind it inward, like the thick edge of a lens. */
const LG = { on: false, cache: new Map(), n: 0 };
function refractSupported() {
  let chromium = false;
  try { chromium = !!(navigator.userAgentData && navigator.userAgentData.brands && navigator.userAgentData.brands.some(b => /Chromium/.test(b.brand))); } catch (e) { chromium = false; }
  try { return chromium && CSS.supports('backdrop-filter', 'url(#lg-defs) blur(2px)'); } catch (e) { return false; }
}
function initGlass(fx) {
  const root = document.documentElement;
  LG.on = refractSupported() && fx === 'full';
  root.classList.toggle('lg-refract', LG.on);
  root.classList.toggle('fx-saver', fx === 'saver');
  root.classList.toggle('fx-frosted', fx === 'frosted');
  if (LG.on) refractNow(); else for (const el of document.querySelectorAll('.refract[data-lg]')) { delete el.dataset.lg; el.style.removeProperty('--lg'); }
}
function lensMap(w, h, r, edge) {
  const k = 0.5, cw = Math.max(8, Math.round(w * k)), ch = Math.max(8, Math.round(h * k));
  const R = Math.max(1, r * k), E = Math.max(2, edge * k), hx = cw / 2, hy = ch / 2;
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(cw, ch), d = img.data;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const px = x + 0.5 - hx, py = y + 0.5 - hy, sx = px < 0 ? -1 : 1, sy = py < 0 ? -1 : 1;
      const qx = Math.abs(px) - (hx - R), qy = Math.abs(py) - (hy - R);
      let nx = 0, ny = 0, dist;
      if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy) || 1; nx = sx * qx / l; ny = sy * qy / l; dist = R - l; }
      else if (qx >= qy) { nx = sx; dist = R - qx; }
      else { ny = sy; dist = R - qy; }
      const t = Math.min(1, Math.max(0, 1 - dist / E)), s = t * t * (3 - 2 * t);
      const i = (y * cw + x) * 4;
      d[i] = 128 - nx * s * 127; d[i + 1] = 128 - ny * s * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}
function lgFilter(w, h, r) {
  const key = w + 'x' + h + 'x' + r;
  if (LG.cache.has(key)) return LG.cache.get(key);
  const defs = document.getElementById('lg-defs');
  if (!defs) return '';
  if (LG.cache.size > 24) { defs.textContent = ''; LG.cache.clear(); for (const el of document.querySelectorAll('.refract[data-lg]')) delete el.dataset.lg; }
  const url = lensMap(w, h, r, Math.min(30, Math.min(w, h) * 0.32));
  if (!url) return '';
  const ns = 'http://www.w3.org/2000/svg', id = 'lg' + (++LG.n);
  const f = document.createElementNS(ns, 'filter');
  const set = (el, o) => { for (const k in o) el.setAttribute(k, o[k]); return el; };
  set(f, { id, x: 0, y: 0, width: w, height: h, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
  f.appendChild(set(document.createElementNS(ns, 'feImage'), { href: url, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', result: 'map' }));
  f.appendChild(set(document.createElementNS(ns, 'feDisplacementMap'), { in: 'SourceGraphic', in2: 'map', scale: Math.round(Math.min(46, Math.min(w, h) * 0.5)), xChannelSelector: 'R', yChannelSelector: 'G' }));
  defs.appendChild(f);
  LG.cache.set(key, id);
  return id;
}
function refractNow() {
  if (!LG.on) return;
  for (const el of document.querySelectorAll('.refract')) {
    const b = el.getBoundingClientRect();
    if (b.width < 8 || b.height < 8) continue;
    const w = Math.round(b.width), h = Math.round(b.height);
    const r = Math.round(Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2));
    const key = w + 'x' + h + 'x' + r;
    if (el.dataset.lg === key) continue;
    const id = lgFilter(w, h, r);
    if (!id) continue;
    el.dataset.lg = key;
    el.style.setProperty('--lg', 'url(#' + id + ')');
  }
}
