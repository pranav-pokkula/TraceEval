// Operator-only helper: credentials stay in memory or ignored, mode-0600 local files.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
const exec = promisify(execFile);
const org = process.env.TRACEEVAL_ORGANIZATION_ID;
if (!org || !/^[a-z0-9]+$/.test(org)) throw new Error('Set the intended dedicated TraceEval organization ID.');
let token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token && process.platform === 'darwin') {
  for (const account of ['supabase', 'default', 'access-token']) {
    try { token = (await exec('security', ['find-generic-password', '-s', 'Supabase CLI', '-a', account, '-w'])).stdout.trim(); if (token) break; } catch { /* only inspect Supabase CLI entries */ }
  }
}
if (token?.startsWith('go-keyring-base64:')) token = Buffer.from(token.slice('go-keyring-base64:'.length), 'base64').toString('utf8');
if (!token) { console.error('Supabase secure CLI login is unavailable. Run supabase login privately.'); process.exit(2); }
const password = randomBytes(32).toString('base64url');
async function api(path, body) {
  const response = await fetch(`https://api.supabase.com/v1${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), redirect: 'error', signal: AbortSignal.timeout(30000) });
  const data = await response.json(); return { response, data };
}
await mkdir('artifacts/production', { recursive: true });
try {
  const organizations = await api('/organizations');
  if (!organizations.response.ok || !organizations.data.some(o => o.id === org && o.name === 'TraceEval')) throw new Error('Dedicated TraceEval organization could not be verified.');
  const existing = await api('/projects');
  if (!existing.response.ok) throw new Error('Existing projects could not be inspected.');
  const found = existing.data.find(p => p.organization_id === org && p.name === 'TraceEval');
  const { response, data } = found ? { response: { ok: true, status: 200 }, data: found } : await api('/projects', { name: 'TraceEval', organization_id: org, region: 'us-east-1', db_pass: password, plan: 'free' });
  const detail = typeof data.message === 'string' ? data.message.replaceAll(password, '[REDACTED]').replaceAll(token, '[REDACTED]').slice(0, 1500) : undefined;
  const receipt = { organizationId: org, name: 'TraceEval', region: 'us-east-1', success: response.ok, statusCode: response.status, ...(response.ok ? { id: data.id, status: data.status, reused: !!found } : { detail: detail || 'Creation rejected by management API.' }), recordedAt: new Date().toISOString() };
  if (response.ok && !found) { await mkdir('.release-private', { recursive: true, mode: 0o700 }); await writeFile('.release-private/supabase-db-password', password, { mode: 0o600 }); }
  await writeFile('artifacts/production/supabase-provisioning.json', JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt)); if (!response.ok) process.exitCode = 1;
} catch { console.error('Supabase provisioning could not finish. Check authorized connectivity and inspect existing project metadata before retrying.'); process.exitCode = 1; }
