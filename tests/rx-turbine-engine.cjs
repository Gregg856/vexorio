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

test('real approved handlers run concurrently and report measurements',async()=>{
 const {executeApproved}=require('../rx-turbine-engine.cjs');
 const turbine=createTurbine();
 for(let i=0;i<4;i++)turbine.submit({id:'RXJOB-'+i,kind:'inspect_ci',target:'run-'+i});
 let active=0,peak=0;
 const handlers={inspect_ci:async()=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,10));active--;return true;}};
 await assert.rejects(executeApproved(turbine,{handlers}),/approval/i);
 const report=await executeApproved(turbine,{approved:true,handlers,maxParallel:2});
 assert.equal(report.executed,4);assert.equal(report.peakActive,2);assert.equal(peak,2);
 assert.equal(report.results.every(x=>x.status==='completed'&&x.ok),true);
});
test('missing handlers do not pretend to execute',async()=>{
 const {executeApproved}=require('../rx-turbine-engine.cjs');
 const turbine=createTurbine();
 turbine.submit({id:'RXJOB-one',kind:'inspect_ci',target:'run-one'});
 const report=await executeApproved(turbine,{approved:true});
 assert.equal(report.executed,0);assert.equal(report.results[0].status,'skipped');
});
