'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createTurbine}=require('../rx-turbine-engine.cjs');
test('bounded parallel waves and duplicate protection',()=>{
 const t=createTurbine({maxParallel:2});
 for(let i=0;i<5;i++)assert.equal(t.submit({id:'RXJOB-'+i,kind:'inspect_ci',target:'run-'+i}).accepted,true);
 assert.equal(t.submit({id:'RXJOB-extra',kind:'inspect_ci',target:'run-0'}).reason,'duplicate');
 const p=t.plan();assert.deepEqual(p.waves.map(w=>w.length),[2,2,1]);
 assert.equal(p.executed,0);assert.equal(p.cloudExecutorConnected,false);
});
test('rejects unsafe task targets',()=>{
 const t=createTurbine();
 assert.throws(()=>t.submit({id:'RXJOB-bad',kind:'inspect_ci',target:'../secrets'}));
});
