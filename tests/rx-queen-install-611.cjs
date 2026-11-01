'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const installer=fs.readFileSync('deploy/rxcloud-install.sh','utf8');
const match=installer.match(/^runtime_modules=\(([^\n]+)\)$/m);
assert.ok(match,'runtime module allowlist exists');
for(const file of ['rx-queen-model-bridge.mjs','rx-bibi-model-bridge.mjs','rx-queen-local-model.cjs']){
 assert.ok(match[1].split(/\s+/).includes(file),file+' must be copied by self-host installer');
 assert.ok(fs.existsSync(file),file+' must exist');
}
console.log('RX #611 self-host model runtime packaging: PASS');
