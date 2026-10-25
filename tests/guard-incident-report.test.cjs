'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const workflow=fs.readFileSync('.github/workflows/guard-monitor.yml','utf8');
for(const label of ['### Ocena diagnozy RX','Objawy: ','Przyczyna: NIEPOTWIERDZONA','Powtarzalnosc: ','Rozwiazanie: ','Dzialanie: tylko rekomendacja']){
 assert.ok(workflow.includes(label),'Missing RX report section: '+label);
}
assert.ok(workflow.includes("const diagnosticNote = ["),'Missing RX diagnostic report');
assert.ok(workflow.includes("priorNote + '\\\\n\\\\n' + diagnosticNote"),'RX diagnostic must be included in incident reports');
assert.ok(workflow.includes("automatic_patch_allowed: false"),'RX must remain read-only');
console.log('PASS: RX incident report separates evidence, hypotheses and verified fixes');
