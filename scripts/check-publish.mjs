import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files = execFileSync('git', ['ls-files', '--cached', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const forbidden = files.filter(file => /(^|\/)(\.env(?!\.example$)|auth\.json|\.release-private|node_modules|\.next|\.vercel|storage-state|playwright-report|test-results)(\/|$|\.)/.test(file));
const sensitive = [/gh[pousr]_[A-Za-z0-9]{30,}/, /sbp_[a-f0-9]{40}/, /sk-(?:proj-)?[A-Za-z0-9_-]{40,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
for (const file of files) {
  if (/\.(png|jpg|zip)$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  if (sensitive.some(pattern => pattern.test(text))) forbidden.push(file);
}
if (forbidden.length) { console.error('Publish review requires attention for these paths only:'); for (const file of new Set(forbidden)) console.error(file); process.exit(1); }
console.log(`Reviewed ${files.length} staged paths: no forbidden build/private paths or recognized credential patterns found. This is not a comprehensive secret audit.`);
