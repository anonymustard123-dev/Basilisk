import assert from 'node:assert/strict';
const base = process.argv[2] ?? 'http://127.0.0.1:3001';
const response = await fetch(base);
assert.equal(response.status, 200, 'Page must load');
const html = await response.text();
const inline = html.match(/<style\b[^>]*id="basilisk-styles"[^>]*>([\s\S]*?)<\/style>/)?.[1];
assert.ok(inline, 'Core styling must arrive in the HTML, before separate asset requests');
assert.ok(inline.includes('.quiet-grid') && inline.includes('.basilisk-emblem'));
assert.ok(!/@import\b|url\(\s*['"]?https?:/i.test(inline), 'No remote CSS/font dependencies');
assert.ok(!html.includes('/_next/static/css/'), 'Page must not require a CSS chunk to be usable');
const fonts = [
  ...new Set([...inline.matchAll(/url\(['"]?(\/fonts\/[^)'"\s]+)/g)].map((m) => m[1])),
];
assert.ok(fonts.length >= 3, 'Fonts must be same-origin assets');
for (const path of fonts) {
  const asset = await fetch(new URL(path, base));
  assert.equal(asset.status, 200, `Missing font: ${path}`);
  assert.ok((await asset.arrayBuffer()).byteLength > 1000);
}
const logo = await fetch(new URL('/brand/basilisk-logo.svg', base));
assert.equal(logo.status, 200);
const svg = await logo.text();
assert.ok(svg.includes('viewBox="220 95 820 820"') && svg.includes('width="86" height="86"'));
assert.ok(svg.includes('data:image/png;base64,'), 'Logo must be self-contained');
assert.ok(
  !html.includes('src="/brand/basilisk-artwork.png"'),
  'Do not render the full concept sheet',
);
console.log(
  `Style delivery passed for ${base}: inline CSS, ${fonts.length} local fonts, bounded main logo.`,
);
