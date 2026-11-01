'use strict';
const assert = require('node:assert/strict');
const origin = 'https://vexorio.grzegorzbub1985.workers.dev';
const questions = [
  'BIBI, wyjaśnij, jak RX Mrówki wspólnie rozwiązują zadania. Podaj trzy przykłady.',
  'A drugi?',
  'A trzeci?',
  'Podsumuj te trzy przykłady w jednym zdaniu.',
  'Jakie zadania wykonuje RX Tester?',
  'A jakie zadania wykonuje RX FAST?',
  'Czym różnią się te dwa moduły?',
  'Co należy zrobić, gdy test wykryje błąd?',
  'Jak sprawdzić, czy poprawka działa?',
  'Podsumuj naszą rozmowę w trzech punktach.'
];
async function main() {
  let token = process.env.RX_BIBI_TEST_ACCESS_TOKEN;
  if (!token) {
    if (!process.env.RX_BIBI_TEST_EMAIL || !process.env.RX_BIBI_TEST_PASSWORD) {
      throw Error('AUTH_CONFIG_MISSING: set test access token or dedicated email and password in GitHub Secrets');
    }
    const response = await fetch(origin + '/api/rx/client/config', {signal: AbortSignal.timeout(15000)});
    assert.equal(response.status, 200, 'Production chat config HTTP status');
    const config = await response.json();
    assert.ok(config.url && config.anonKey, 'Missing Supabase auth config');
    const login = await fetch(new URL('/auth/v1/token?grant_type=password', config.url), {
      method: 'POST',
      headers: {apikey: config.anonKey, 'Content-Type': 'application/json'},
      body: JSON.stringify({email: process.env.RX_BIBI_TEST_EMAIL, password: process.env.RX_BIBI_TEST_PASSWORD}),
      signal: AbortSignal.timeout(15000)
    });
    if (!login.ok) {
      let code = 'unknown';
      try { const body = await login.json(); code = String(body.error_code || body.code || 'unknown').replace(/[^a-z0-9_-]/gi, '').slice(0,80); } catch {}
      throw Error('AUTH_FAILED: Supabase rejected dedicated tester login (HTTP ' + login.status + ', code=' + code + '). Verify tester password matches GitHub Secret and account belongs to production Supabase project.');
    }
    token = (await login.json()).access_token;
  }
  assert.ok(token, 'No authorized tester session');
  const history = [];
  for (let i = 0; i < questions.length; i++) {
    const message = questions[i];
    const response = await fetch(origin + '/api/rx/client/chat', {
      method: 'POST',
      headers: {Origin: origin, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
      body: JSON.stringify({message, history}),
      signal: AbortSignal.timeout(15000)
    });
    assert.equal(response.status, 200, 'Authenticated chat HTTP status at turn ' + (i + 1));
    const data = await response.json();
    assert.equal(data.ok, true, 'Chat returned failure at turn ' + (i + 1));
    assert.equal(typeof data.answer, 'string', 'Missing answer at turn ' + (i + 1));
    assert.ok(data.answer.trim(), 'Empty answer at turn ' + (i + 1));
    if (i === 1) {
      assert.match(data.answer, /drugi przykład/iu, 'Second-turn context regression');
      assert.equal(data.contextUsed, true, 'Context not used on second turn');
      assert.doesNotMatch(data.answer, /Stan kolejki sprawdzisz/iu, 'Generic queue answer');
    }
    history.push(message, data.answer);
    console.log('PASS: authenticated conversation turn ' + (i + 1) + '/' + questions.length);
  }
  console.log('VERIFIED: 10 authenticated production chat turns, including contextual follow-up');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
