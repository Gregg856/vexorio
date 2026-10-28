'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {runCoordinatedChecks}=require('../rx-coordinator-cloud.cjs');
test('default cannot execute',()=>{
 const r=runCoordinatedChecks('Sprawdź testy w chmurze i model AI');
 assert.equal(r.executed,0);
 assert.ok(r.selectedChecks.length>0);
 assert.equal(r.approvalRequired,true);
});
test('approved mode executes only existing allowlisted checks',()=>{
 const r=runCoordinatedChecks('Sprawdź testy w chmurze i model AI',{approved:true,execute:true,maxChecks:1});
 assert.equal(r.executed,1);
 assert.equal(r.failed,0);
 assert.equal(r.passed,1);
});
test('rejects excessive check budgets',()=>{
 assert.throws(()=>runCoordinatedChecks('Sprawdź testy',{approved:true,execute:true,maxChecks:99}));
});
