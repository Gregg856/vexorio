// RX NAUKA 4.3 — read-only BIBI memory integration contract.
// Run: node --test tests/rx-nauka-4-3.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const panel = fs.readFileSync(path.join(__dirname, '..', 'rx-bibi-manager.html'), 'utf8');

test('existing BIBI panel uses the authenticated read-only Brain memory endpoint', () => {
  assert.match(panel, /fetch\('\/api\/rx\/admin\/brain-memory'/);
  assert.match(panel, /Authorization:'Bearer '\+data\.session\.access_token/);
  assert.match(panel, /cache:'no-store'/);
  assert.match(panel, /payload\.kind!=='rx-brain-memory'/);
});

test('memory lookup remains explicitly advisory and never executes an action', () => {
  assert.match(panel, /To wskazówka, wymaga zatwierdzenia\. Niczego nie wykonałam\./);
  assert.match(panel, /Nie mogę przedstawić rekomendacji|nie mogę przedstawić rekomendacji/);
});

test('bad samples and success rates are rejected before display', () => {
  assert.match(panel, /Number\.isSafeInteger\(entry\.samples\)/);
  assert.match(panel, /Number\.isFinite\(entry\.successRate\)/);
  assert.match(panel, /entry\.successRate<0\|\|entry\.successRate>1/);
});

test('few observations and more failures than successes are disclosed', () => {
  assert.match(panel, /entry\.samples<3/);
  assert.match(panel, /entry\.samples<10/);
  assert.match(panel, /entry\.successRate<0\.5/);
});

test('existing chat command handles missing memory and request failures', () => {
  assert.match(panel, /RX Brain nie ma zapisanego doświadczenia/);
  assert.match(panel, /Nie mogę odczytać pamięci RX Brain/);
  assert.match(panel, /finally\{send\.disabled=false;\}/);
});
