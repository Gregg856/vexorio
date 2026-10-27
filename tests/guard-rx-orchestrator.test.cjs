'use strict';
const assert=require('node:assert/strict');
const {route,capabilities,createSession}=require('../guard-rx-orchestrator.js');
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
assert.equal(capabilities().length,12);
assert.ok(capabilities().every(x=>x.mode!=='write'&&x.mode!=='deploy'));
assert.equal(new Set(capabilities().map(x=>x.id)).size,12);
for(const [command,module] of [['meduza','rx-medusa'],['mrówki','rx-ant-task-board'],['królowa','rx-queen'],['bibi ai','rx-bibi-ai'],['komputer rx','rx-cloud-computer']]){
 const result=route(command,context);
 assert.equal(result.kind,'module-status');
 assert.equal(result.module,module);
 assert.equal(result.requiresApproval,false);
 assert.equal(capabilities().find(x=>x.id===module)?.mode,'status-only');
}
const session=createSession();
assert.equal(session.lastTask(),null);
assert.match(session.followUp('dalej',context),/Nie mam jeszcze zadania/);
assert.equal(session.remember('Sprawdź wyszukiwarkę VEXORIO'),true);
assert.equal(session.lastTask(),'Sprawdź wyszukiwarkę VEXORIO');
assert.match(session.followUp('dalej',context),/wyszukiwarkę VEXORIO/);
assert.equal(session.remember('hasło: bardzo-tajne'),false);
assert.equal(session.lastTask(),'Sprawdź wyszukiwarkę VEXORIO');
session.clear();
assert.equal(session.lastTask(),null);
console.log('PASS: RX parent coordinator routes safely and preserves existing commands');
