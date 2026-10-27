'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dependencies = ['rx-medusa-engine.cjs','rx-signal-memory.cjs','rx-ant-task-board.cjs','rx-bibi-budget.cjs','rx-source-reader.cjs','guard/rx-developer-core.cjs'];
for (const rel of dependencies) {
 const file = path.join(root, rel);
 assert.ok(fs.existsSync(file), `Missing actual main dependency: ${rel}`);
 const source = fs.readFileSync(file,'utf8');
 assert.ok(!/Fixture placeholder|use actual repository dependencies for integration/i.test(source), `Mock dependency detected: ${rel}`);
}
console.log('PASS: dependencies present and not known placeholders');
