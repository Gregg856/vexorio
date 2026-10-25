'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parseConfirmedFixes,findConfirmedFix}=require('../guard/confirmed-fix-memory.cjs');
const fingerprint='a1b2c3d4e5f60708';
const entry=(status,fp=fingerprint)=>`### RX-FIX-0001 — TLS
- **Status:** ${status}
- **Odcisk awarii (RX-FINGERPRINT):** ${fp}
- **Commit lub PR:** https://github.com/Gregg856/vexorio/commit/abcdef
- **Test regresyjny:** https://github.com/Gregg856/vexorio/actions/runs/12345
`;
const real=fs.readFileSync(path.join(__dirname,'../docs/rx-confirmed-fixes.md'),'utf8');
assert.equal(parseConfirmedFixes(real).length,0);
assert.equal(findConfirmedFix(entry('potwierdzone'),fingerprint).id,'RX-FIX-0001');
assert.equal(findConfirmedFix(entry('do ponownej weryfikacji'),fingerprint),null);
assert.equal(findConfirmedFix(entry('potwierdzone'),'ffffffffffffffff'),null);
assert.equal(findConfirmedFix(entry('potwierdzone','invalid'),'invalid'),null);
assert.equal(findConfirmedFix(entry('potwierdzone').replace('/actions/runs/12345','/issues/1'),fingerprint),null);
console.log('PASS: RX confirmed fix memory uses verified exact fingerprint matches only');
