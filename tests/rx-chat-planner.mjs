import assert from 'node:assert/strict';
import {planRXChat} from '../rx-chat-planner.mjs';
const p=planRXChat('Sprawdź testy i chmurę');
assert.deepEqual(p.tasks.map(x=>x.action),['inspect_tests','plan_cloud_checks']);
assert.equal(p.executed,0);
assert.equal(p.plan.queen.requiresApproval,true);
assert.equal(planRXChat('A chmura?',['Sprawdź testy']).contextUsed,true);
assert.throws(()=>planRXChat('x'.repeat(1001)),TypeError);
console.log('RX chat planner OK');

import catalog from '../rx-task-catalog.cjs';
for(const rule of catalog.RULES){
 const result=planRXChat(rule.words[0]);
 assert.ok(result.tasks.some(task=>task.action===rule.id&&task.module===rule.module&&task.role===rule.role), 'Catalog parity: '+rule.id);
}
