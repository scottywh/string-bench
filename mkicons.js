// Renders icons/<id>.svg to android/res-icons/<id>/mipmap-*/ (launcher + adaptive foreground). Needs playwright.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch();
  async function shot(html, n, out) { fs.mkdirSync(path.dirname(out), { recursive: true }); const p = await b.newPage({ viewport: { width: n, height: n } }); await p.setContent('<body style="margin:0;background:transparent">' + html + '</body>'); await p.screenshot({ path: out, omitBackground: true }); await p.close(); }
  const dens = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const f of fs.readdirSync('icons').filter(x => x.endsWith('.svg'))) {
    const id = f.replace('.svg', ''), svg = fs.readFileSync('icons/' + f, 'utf8'), root = 'android/res-icons/' + id + '/';
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    for (const [d, n] of Object.entries(dens)) await shot(svg.replace('<svg ', '<svg width="' + n + '" height="' + n + '" '), n, root + 'mipmap-' + d + '/ic_launcher.png');
    const fg = '<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432" viewBox="0 0 432 432"><g transform="translate(76 76) scale(0.5703)">' + inner.replace(/<rect width="512" height="512" fill="#0c1112"\/>/, '') + '</g></svg>';
    await shot(fg, 432, root + 'mipmap-xxxhdpi/ic_fg.png');
  }
  await b.close();
})();
