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
  const source = line.slice(line.indexOf('entry.match(') + 'entry.match('.length, line.lastIndexOf(')'));
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
