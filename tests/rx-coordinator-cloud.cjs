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

test('approval without execute remains a dry run',()=>{
 const r=runCoordinatedChecks('Sprawdź testy w chmurze i model AI',{approved:true,execute:false});
 assert.equal(r.executed,0);
 assert.equal(r.passed,0);
 assert.ok(r.checks.every(check=>check.status==='planned'));
});
test('execute without approval remains a dry run',()=>{
 const r=runCoordinatedChecks('Sprawdź testy w chmurze i model AI',{approved:false,execute:true});
 assert.equal(r.executed,0);
 assert.equal(r.approved,false);
 assert.ok(r.checks.every(check=>check.status==='planned'));
});
test('unknown command never starts checks even when approved',()=>{
 const r=runCoordinatedChecks('napisz opowiadanie',{approved:true,execute:true});
 assert.equal(r.executed,0);
 assert.deepEqual(r.selectedChecks,[]);
});
test('zero budget cannot execute checks',()=>{
 const r=runCoordinatedChecks('Sprawdź testy w chmurze',{approved:true,execute:true,maxChecks:0});
 assert.equal(r.executed,0);
});
test('invalid approval types are rejected',()=>{
 assert.throws(()=>runCoordinatedChecks('Sprawdź testy',{approved:'yes',execute:true}));
 assert.throws(()=>runCoordinatedChecks('Sprawdź testy',{approved:true,execute:'yes'}));
});
