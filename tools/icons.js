// Renders the app icons once: node tools/icons.js   (needs Playwright)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'site', 'icons');
const INK = '#1c5cab';
const lines = '<path d="M128 177h178M128 256h178M128 335h118M364 138v236M404 138v236" fill="none" stroke="#fff" stroke-width="31" stroke-linecap="round"/>';
const svgs = {
  'favicon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="120" fill="${INK}"/>${lines}</svg>`,
  any: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="120" fill="${INK}"/>${lines}</svg>`,
  full: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${INK}"/><g transform="translate(64 64) scale(.75)">${lines}</g></svg>`
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'favicon.svg'), svgs['favicon.svg']);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const render = async (svg, size, file) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent"><img style="display:block;width:${size}px;height:${size}px" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`);
    await page.screenshot({ path: path.join(OUT, file), omitBackground: true });
  };
  await render(svgs.any, 192, 'icon-192.png');
  await render(svgs.any, 512, 'icon-512.png');
  await render(svgs.full, 512, 'maskable-512.png');
  await render(svgs.full, 180, 'apple-touch-icon.png');
  await browser.close();
  console.log('icons written to', OUT);
})();
