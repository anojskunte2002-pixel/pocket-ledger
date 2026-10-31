// Builds the app: node build.js
//   dist/pocket-ledger.html  page published as a Claude artifact (cloud storage + Claude)
//   dist/local.html          the same page in a skeleton like the artifact viewer's, for tests
//   docs/                    the website version for GitHub Pages (installable, works offline)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const read = f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
const order = ['core.js', 'parser.js', 'store.js', 'analytics.js', 'charts.js', 'ai.js', 'examples.js', 'bg.js', 'ui.js', 'actions.js', 'sheets.js', 'main.js'];
const script = '(function () {\n"use strict";\n' + order.map(read).join('\n') + '\n})();';
if (/<\/script/i.test(script)) throw new Error('script contains a closing script tag');
const shell = read('shell.html');
const fill = s => s.replace('/*STYLES*/', () => read('styles.css')).replace('/*SCRIPT*/', () => script);

// 1. Claude artifact
const page = fill(shell);
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'pocket-ledger.html'), page);
fs.writeFileSync(path.join(ROOT, 'dist', 'app.js'), script);
const skeleton = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
fs.writeFileSync(path.join(ROOT, 'dist', 'local.html'), skeleton + page + '</body></html>');
// the same page as one complete document, for publishing from a file
const mark = page.indexOf('<!--BODY-->');
fs.writeFileSync(path.join(ROOT, 'dist', 'artifact.html'), '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
  page.slice(0, mark) + '</head>\n<body>\n' + page.slice(mark + '<!--BODY-->'.length) + '</body>\n</html>\n');

// 2. Website (GitHub Pages)
const SITE = path.join(ROOT, 'docs');
fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(path.join(SITE, 'icons'), { recursive: true });
const split = shell.indexOf('<!--BODY-->');
if (split < 0) throw new Error('shell.html needs a <!--BODY--> marker');
const headBits = shell.slice(0, split).replace(/<title>[\s\S]*?<\/title>\s*/, '').replace(/<meta name="claude:viewport-fit-sides"[^>]*>\s*/, '');
const bodyBits = shell.slice(split + '<!--BODY-->'.length);
const desc = 'Track money by just saying it, alone or as a couple. Type or speak entries in plain words, plan the month around rent, EMIs and money sent home, and see what is safe to spend. Your entries stay on your device.';
const html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
  '<title>Pocket Ledger</title>\n<meta name="description" content="' + desc + '">\n' +
  '<meta name="theme-color" content="#0a1f3d">\n' +
  '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n' +
  '<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="Ledger">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n' +
  '<meta property="og:title" content="Pocket Ledger">\n<meta property="og:description" content="' + desc + '">\n' +
  '<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n' +
  fill(headBits) + '</head>\n<body>\n' + fill(bodyBits) +
  '\n<script>if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(SITE, 'index.html'), html);
const hash = crypto.createHash('sha256').update(html).digest('hex').slice(0, 12);
fs.writeFileSync(path.join(SITE, 'sw.js'), fs.readFileSync(path.join(ROOT, 'site', 'sw.js'), 'utf8').replace('__BUILD__', hash));
fs.writeFileSync(path.join(SITE, 'manifest.webmanifest'), JSON.stringify({
  name: 'Pocket Ledger',
  short_name: 'Ledger',
  description: desc,
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#02050f',
  theme_color: '#0a1f3d',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ],
  shortcuts: [
    { name: 'Insights', url: './#insights' },
    { name: 'Plan', url: './#plan' }
  ]
}, null, 2));
for (const f of fs.readdirSync(path.join(ROOT, 'site', 'icons'))) fs.copyFileSync(path.join(ROOT, 'site', 'icons', f), path.join(SITE, 'icons', f));
fs.writeFileSync(path.join(SITE, '.nojekyll'), '');
console.log('built', (page.length / 1024).toFixed(1) + ' KB artifact,', 'website', hash);
