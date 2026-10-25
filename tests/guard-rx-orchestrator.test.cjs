'use strict';
const assert=require('node:assert/strict');
const {route,capabilities}=require('../guard-rx-orchestrator.js');
const {respondNatural}=require('../guard-rx-conversation.js');
const {analyzeTask}=require('../guard-engine-2.js');
const context={conversation:{respondNatural},analyzeTask};
for(const [command,module] of [['audyt: eval(1)','code-audit'],['kod: const x=1','developer-inspector'],['diff: abc','developer-diff'],['github','changes-report'],['plan: test','task-analyzer'],['historia','history']]){
 const result=route(command,context);assert.equal(result.module,module);assert.equal(result.kind,'legacy');
}
const natural=route('Sprawdź wyszukiwarkę VEXORIO',context);
assert.equal(natural.kind,'advisory');
assert.equal(natural.module,'rx-conversation');
assert.match(natural.message,/Plan:/);
assert.equal(natural.requiresApproval,false);
assert.equal(route('x'.repeat(2001),context).kind,'invalid');
assert.equal(route('pomoc',context).module,'commands');
assert.equal(route('usuń bazę danych',context).kind,'advisory');
assert.match(route('usuń bazę danych',context).message,/wysokie/);
assert.equal(capabilities().length,7);
assert.ok(capabilities().every(x=>x.mode!=='write'&&x.mode!=='deploy'));
assert.equal(new Set(capabilities().map(x=>x.id)).size,7);
console.log('PASS: RX parent coordinator routes safely and preserves existing commands');
