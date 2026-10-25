'use strict';
const assert=require('node:assert/strict');
const {analyzeTask}=require('../guard-engine-2.js');
for(const [command,intent,risk] of [
 ['sprawdź testy','testing','low'],
 ['dodaj nową funkcję','development','medium'],
 ['usuń bazę danych','security','high'],
 ['publikuj na Cloudflare','deployment','high'],
 ['przetłumacz na ukraiński','translation','low']
]){
 const result=analyzeTask(command);
 assert.equal(result.ok,true,command);
 assert.equal(result.intent,intent,command);
 assert.equal(result.risk,risk,command);
 assert.equal(result.requiresApproval,true);
 assert.equal(result.execution,'not_connected');
 assert.equal(result.steps.length,4);
}
assert.equal(analyzeTask('').ok,false);
assert.equal(analyzeTask('x'.repeat(2001)).ok,false);
console.log('PASS: Guard Engine 2.0 intent analysis and conservative approval requirements');
