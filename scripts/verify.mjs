import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
const id = new Date().toISOString().replace(/[:.]/g, '-');
const dir = `artifacts/receipts/${id}`;
await mkdir(dir, { recursive: true });
const steps = [['generate', ['run', 'generate', '--', '--check']], ['unit-integration', ['test']], ['build', ['run', 'build']], ['typecheck', ['run', 'typecheck']], ['fixture-evaluation', ['run', 'evaluate']], ['browser', ['run', 'test:e2e']]];
const receipts = [];
for (const [name, args] of steps) {
  const startedAt = new Date().toISOString();
  const output = createWriteStream(`${dir}/${name}.log`);
  console.log(`\nRunning ${name}: npm ${args.join(' ')}`);
  const child = spawn('npm', args, { env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', TRACEEVAL_STORAGE: 'local', TRACEEVAL_LIVE_ENABLED: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output.write(chunk); process.stdout.write(chunk); });
  const exitCode = await new Promise(resolve => { child.on('error', () => resolve(127)); child.on('close', code => resolve(code ?? 1)); });
  await new Promise(resolve => output.end(resolve));
  receipts.push({ name, command: ['npm', ...args], startedAt, endedAt: new Date().toISOString(), exitCode, log: `${dir}/${name}.log` });
  await writeFile(`${dir}/summary.json`, JSON.stringify({ environment: 'local-or-ci-fixture-only', node: process.version, lockfileSha256: createHash('sha256').update(await readFile('package-lock.json')).digest('hex'), steps: receipts }, null, 2));
  if (exitCode !== 0) { console.error(`Stopped at ${name}; see ${dir}.`); process.exitCode = 1; break; }
}
console.log(`Receipts preserved: ${dir}`);
