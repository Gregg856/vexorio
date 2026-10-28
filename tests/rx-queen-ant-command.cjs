'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('worker.js','utf8');
test('Queen chat recognizes both Polish ant commands',()=>{
  assert.match(source,/uruchom testy mrówek/);
  assert.match(source,/uruchom testy mrowek/);
});
test('Ant dispatch uses existing Meduza workflow and main branch',()=>{
  assert.match(source,/actions\/workflows\/rx-medusa-ant\.yml\/dispatches/);
  assert.match(source,/body:JSON\.stringify\(\{ref:'main'\}\)/);
});
test('Owner check and GitHub dispatch secret remain mandatory',()=>{
  assert.match(source,/identity\.id!==env\.RX_ADMIN_USER_ID/);
  assert.match(source,/if\(!env\.RX_GITHUB_DISPATCH_TOKEN\)/);
});
test('Ant workflow remains manual-dispatchable and read-only',()=>{
  const workflow=fs.readFileSync('.github/workflows/rx-medusa-ant.yml','utf8');
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/permissions:\s*\n\s*contents: read/);
});
