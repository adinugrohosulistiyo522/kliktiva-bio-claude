// Pemeriksaan statis untuk paket Cloudflare Pages.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const must = ['public/index.html', 'public/admin.html', 'functions/api.js', 'public/_headers'];
for (const f of must) assert.ok(existsSync(f), `File wajib tidak ada: ${f}`);

const api = readFileSync('functions/api.js', 'utf8');
const syntax = spawnSync(process.execPath, ['--check', 'functions/api.js'], { encoding: 'utf8' });
assert.equal(syntax.status, 0, `Sintaks functions/api.js salah:\n${syntax.stderr}`);

const allowed = new Set([...api.split('const SCRIPT_URL_RE')[0].matchAll(/'([A-Za-z]+)'/g)].map(m => m[1]));
for (const f of ['public/index.html', 'public/admin.html']) {
  const html = readFileSync(f, 'utf8');
  assert.ok(html.includes("fetch('/api'"), `${f} harus memanggil fetch('/api')`);
  assert.ok(!html.includes('/.netlify/functions'), `${f} masih memanggil jalur Netlify`);
  const used = new Set([...html.matchAll(/API\(\s*['"]([A-Za-z]+)['"]/g)].map(m => m[1]));
  for (const a of used) assert.ok(allowed.has(a), `${f} memakai action "${a}" yang tidak ada di allowlist functions/api.js`);
}
for (const bad of ['wrangler.jsonc', 'src/index.js', 'netlify.toml']) {
  assert.ok(!existsSync(bad), `${bad} tidak boleh ada di proyek Pages (membingungkan build)`);
}
console.log('OK: paket Cloudflare Pages lolos pemeriksaan statis.');
