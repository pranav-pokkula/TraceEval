import pg from 'pg';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
const url = process.env.TRACEEVAL_TEST_DATABASE_URL;
if (!url) {
  console.error('RLS test NOT RUN: set TRACEEVAL_TEST_DATABASE_URL to an isolated test Postgres/Supabase database. Never use production.');
  process.exit(2);
}
const client = new pg.Client({ connectionString: url });
const lines = [];
const log = message => { lines.push(message); console.log(message); };
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const runId = '33333333-3333-4333-8333-333333333333';
async function rejects(sql, params = []) {
  await client.query('savepoint expected_rejection');
  let rejected = false;
  try { await client.query(sql, params); } catch (e) { rejected = ['42501', '23503', '23514'].includes(e.code); }
  await client.query('rollback to savepoint expected_rejection');
  assert.equal(rejected, true, 'Expected database permission/constraint rejection');
}
async function user(id) {
  await client.query('reset role');
  await client.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
  await client.query('set local role authenticated');
}
try {
  await client.connect(); await client.query('begin');
  if (process.env.TRACEEVAL_TEST_BOOTSTRAP === 'true') {
    // Minimal Supabase auth contract in disposable PostgreSQL, not a GoTrue integration test.
    await client.query(`create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;`);
    for (const name of (await readdir('supabase/migrations')).filter(name => name.endsWith('.sql')).sort()) {
      const migration = await readFile(`supabase/migrations/${name}`, 'utf8');
      await client.query(migration.replace(/^begin;\s*/i, '').replace(/commit;\s*$/i, ''));
    }
  }
  await client.query('insert into auth.users(id) values ($1), ($2)', [owner, other]);
  await user(owner);
  const payload = { id: runId, name: 'RLS test', adapter: 'fixture', datasetHash: 'test', evaluatorVersion: 'test', createdAt: new Date().toISOString(), results: [{ caseId: 'case-0001' }] };
  await client.query('insert into public.runs(id,owner_id,payload) values ($1,$2,$3)', [runId, owner, payload]);
  assert.equal((await client.query('select * from public.runs')).rowCount, 1);
  await client.query("insert into public.reviews(owner_id,run_id,case_id,score,rationale) values ($1,$2,'case-0001',2,'Supported by fictional evidence.')", [owner, runId]);
  log('PASS: owner can insert and read a run and human review.');
  await user(other);
  assert.equal((await client.query('select * from public.runs')).rowCount, 0);
  assert.equal((await client.query('select * from public.reviews')).rowCount, 0);
  assert.equal((await client.query('delete from public.runs where id=$1', [runId])).rowCount, 0);
  assert.equal((await client.query("update public.reviews set score=0 where run_id=$1", [runId])).rowCount, 0);
  log('PASS: another user cannot read, delete, or edit the owner records.');
  await rejects('insert into public.runs(id,owner_id,payload) values ($1,$2,$3)', ['44444444-4444-4444-8444-444444444444', owner, { ...payload, id: '44444444-4444-4444-8444-444444444444' }]);
  await rejects("insert into public.reviews(owner_id,run_id,case_id,score,rationale) values ($1,$2,'case-0002',2,'Forged cross-owner association.')", [other, runId]);
  log('PASS: forged owner insert and cross-owner review reference are rejected.');
  await user(owner);
  await rejects("insert into public.reviews(owner_id,run_id,case_id,score,rationale) values ($1,$2,'case-9999',2,'Case not in the evaluated run.')", [owner, runId]);
  log('PASS: review case membership is enforced in PostgreSQL.');
  assert.equal((await client.query('select public.reserve_live_budget(10) as allowed')).rows[0].allowed, true);
  assert.equal((await client.query('select public.reserve_live_budget(1) as allowed')).rows[0].allowed, false);
  assert.equal((await client.query('select public.reserve_live_budget(null) as allowed')).rows[0].allowed, false);
  await rejects('select * from public.live_requests');
  log('PASS: live minute quota is enforced and quota rows are inaccessible.');
  await client.query('reset role'); await client.query('set local role anon');
  await rejects('select * from public.runs'); await rejects('select * from public.reviews'); await rejects('select public.reserve_live_budget(1)');
  log('PASS: anonymous access to runs, reviews, and live quota is denied.');
  await client.query('rollback'); log('PASS: all RLS checks completed; test data rolled back.');
} catch (e) {
  try { await client.query('rollback'); } catch {}
  // Database URLs and provider error detail may contain credentials. Do not log them.
  log(`FAIL: RLS verification failed (code ${typeof e.code === 'string' && /^[A-Z0-9_]+$/.test(e.code) ? e.code : 'ASSERTION_OR_CONNECTION'}). Inspect the test database configuration privately.`);
  process.exitCode = 1;
} finally {
  await client.end(); await mkdir('artifacts/receipts', { recursive: true });
  await writeFile(`artifacts/receipts/rls-${new Date().toISOString().replace(/[:.]/g, '-')}.log`, lines.join('\n') + '\n');
}
