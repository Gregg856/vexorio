'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {planCommand}=require('../rx-command-bridge.cjs');
test('one command coordinates RX modules without execution',()=>{
 const p=planCommand('Sprawdź błędy testów i model AI',{energyBalance:20});
 assert.ok(p.steps.length>=2);
 assert.equal(p.autoExecuted,0);
 assert.equal(p.requiresApproval,true);
 assert.equal(p.modelInferenceUsed,false);
 assert.equal(p.canReserve,p.totalCost<=20);
});
test('unknown and malformed commands are safe',()=>{
 assert.equal(planCommand('zrób coś nowego').status,'unrecognized');
 assert.throws(()=>planCommand('x'));
 assert.throws(()=>planCommand('sprawdź testy',{energyBalance:-1}));
});
