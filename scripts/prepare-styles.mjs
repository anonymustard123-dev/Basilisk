import { readFileSync, writeFileSync } from 'node:fs';
const sources = ['app/fonts.css', 'app/globals.css', 'app/brand.css'];
const styles = sources.map((path) => readFileSync(path, 'utf8')).join('\n');
if (/@import\b|url\(\s*['"]?https?:/i.test(styles)) {
  throw new Error('App styles must not depend on external stylesheets or fonts.');
}
writeFileSync('lib/site-styles.generated.json', JSON.stringify({ styles }));
