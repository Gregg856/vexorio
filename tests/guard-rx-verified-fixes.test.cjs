'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const workflow = fs.readFileSync('.github/workflows/guard-monitor.yml', 'utf8');
const names = ['status', 'match', 'commit', 'test'];
const patterns = {};
for (const name of names) {
  const line = workflow.split('\n').find(line => line.includes('const ' + name + ' = entry.match('));
  assert.ok(line, 'Missing RX parser expression: ' + name);
  const source = line.match(/entry\.match\((\/.*\/m)\)/)?.[1];
  assert.ok(source, 'Cannot extract RX regex: ' + name);
  patterns[name] = vm.runInNewContext(source);
}
const fingerprint = 'abcdef0123456789';
const sample = [
  '### RX-FIX-0042 — Testowana naprawa',
  '- **Status:** potwierdzone',
  '- **Odcisk awarii (RX-FINGERPRINT):** ' + fingerprint,
  '- **Commit lub PR:** https://github.com/example/repo/commit/123',
  '- **Test regresyjny:** https://github.com/example/repo/actions/runs/456',
].join('\n');
const entry = sample.split(/^### RX-FIX-/m)[1];
function matched(text, fp) {
  const status = text.match(patterns.status)?.[1]?.trim().toLowerCase();
  const match = text.match(patterns.match);
  const commit = text.match(patterns.commit);
  const test = text.match(patterns.test);
  return status === 'potwierdzone' && match?.[1] === fp && !!commit && !!test;
}
assert.equal(matched(entry, fingerprint), true, 'Verified fix should match');
assert.equal(matched(entry, '0000000000000000'), false, 'Other fingerprint must not match');
assert.equal(matched(entry.replace('potwierdzone', 'do ponownej weryfikacji'), fingerprint), false, 'Unverified fix must not match');
assert.equal(matched(entry.replace('https://github.com/example/repo/actions/runs/456', '[brak]'), fingerprint), false, 'Missing regression test must not match');
assert.equal(matched(entry.replace('https://github.com/example/repo/commit/123', '[brak]'), fingerprint), false, 'Missing commit must not match');
console.log('RX verified-fix parser: 5 tests passed');

/* Validate all embedded GitHub Script steps before the workflow reaches production. */
const lines = workflow.split('\n');
let scriptCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (!/^          script: \|\s*$/.test(lines[i])) continue;
  const block = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (lines[j].trim() && !lines[j].startsWith('            ')) break;
    block.push(lines[j].startsWith('            ') ? lines[j].slice(12) : '');
  }
  assert.doesNotThrow(() => new vm.Script('(async () => {\n' + block.join('\n') + '\n})()'), 'Invalid GitHub Script block at workflow line ' + (i + 1));
  scriptCount++;
}
assert.ok(scriptCount >= 2, 'Expected failure and recovery GitHub Script steps');
console.log('RX workflow: ' + scriptCount + ' embedded GitHub scripts parse successfully');
