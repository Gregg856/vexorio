'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('guard-lab.html','utf8');
const script=fs.readFileSync('guard-rx-live-command-center.js','utf8');
assert.match(html,/id="rxLiveCommandCenter"/);
assert.match(html,/guard-rx-live-command-center\.js/);
assert.match(html,/data-rx-live-grid/);
assert.match(script,/Promise\.all/);
assert.match(script,/cache:'no-store'/);
assert.match(script,/kind:'unknown'/);
assert.doesNotMatch(script,/innerHTML\s*=/);
assert.doesNotMatch(script,/localStorage|sessionStorage|POST|DELETE/);
console.log('PASS RX LIVE COMMAND CENTER mounted, read-only and missing-data aware');

assert.match(html,/data-rx-readiness/);
assert.ok(script.includes('rx-capability-public.json'));
assert.match(script,/nie telemetria na żywo/);
console.log('PASS RX readiness map rendered with missing-inbox warning');

const registry=JSON.parse(fs.readFileSync('rx-capability-public.json','utf8'));
const {inventory}=require('../rx-capability-inventory.cjs');
const source=inventory().components;
assert.deepEqual(registry.components.map(x=>[x.id,x.file,x.role,x.status]),source.map(x=>[x.id,x.file,x.role,x.status]));
assert.equal(registry.components.length,16);
