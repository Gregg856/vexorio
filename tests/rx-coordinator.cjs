'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coordinateRX,executeCoordinatedRX}=require('../rx-coordinator.cjs');
test('integrates existing RX command, DNA, turbine and energy',()=>{
 const p=coordinateRX('Sprawdź testy w chmurze i model AI',{initialCredits:25,maxParallel:2});
 assert.ok(p.ants.length>=2);
 assert.ok(p.turbine.waves.length>=1);
 assert.ok(p.ants.every(a=>/^RX-\d{6}$/.test(a.dna)));
 assert.equal(p.energy.balance,25);
 assert.equal(p.executed,0);
 assert.equal(p.cloud.executionConnected,false);
});
test('unrecognized command produces no tasks',()=>{
 const p=coordinateRX('napisz opowiadanie');
 assert.equal(p.ants.length,0);
 assert.equal(p.turbine.planned,0);
});

test('Queen cannot execute coordinated tasks without explicit approval',async()=>{
 let calls=0;
 await assert.rejects(executeCoordinatedRX('Sprawdź testy w chmurze',{handlers:{run_unit_tests:async()=>{calls++;return true;}}}),/approval/i);
 assert.equal(calls,0);
});
test('approved Queen work reaches real Turbine handlers with bounded concurrency',async()=>{
 const command='Sprawdź testy w chmurze i model AI';
 const planned=coordinateRX(command,{initialCredits:25,maxParallel:2});
 assert.ok(planned.turbine.planned>0,'Expected Queen tasks');
 const calls=[];
 const handlers=Object.fromEntries([...new Set(planned.turbine.waves.flat().map(t=>t.kind))].map(kind=>[kind,async target=>{
  calls.push({kind,target});return true;
 }]));
 const result=await executeCoordinatedRX(command,{approved:true,handlers,initialCredits:25,maxParallel:2});
 assert.equal(result.kind,'rx-coordinated-execution');
 assert.equal(result.planned,planned.turbine.planned);
 assert.equal(result.execution.executed,planned.turbine.planned);
 assert.equal(calls.length,planned.turbine.planned);
 assert.ok(result.execution.peakActive<=2);
 assert.ok(result.execution.results.every(item=>item.status==='completed'));
 assert.equal(result.productionModified,false);
 assert.equal(result.automaticDeployment,false);
});
test('Queen reports skipped work instead of claiming execution without handlers',async()=>{
 const result=await executeCoordinatedRX('Sprawdź testy w chmurze',{approved:true});
 assert.equal(result.execution.executed,0);
 assert.ok(result.execution.results.every(item=>item.status==='skipped'));
});

test('Queen executes exactly the approved task snapshot',async()=>{
 const command='Sprawdź testy w chmurze i model AI';
 const expectedTasks=coordinateRX(command,{initialCredits:25,maxParallel:2}).turbine.waves.flat();
 let calls=0;
 const handlers=Object.fromEntries([...new Set(expectedTasks.map(t=>t.kind))].map(kind=>[kind,async()=>{calls++;return true;}]));
 const result=await executeCoordinatedRX(command,{approved:true,expectedTasks,handlers,initialCredits:25,maxParallel:2});
 assert.equal(result.execution.executed,expectedTasks.length);
 assert.equal(calls,expectedTasks.length);
});
test('Queen rejects altered approved tasks without invoking any handlers',async()=>{
 const command='Sprawdź testy w chmurze i model AI';
 const original=coordinateRX(command,{initialCredits:25,maxParallel:2}).turbine.waves.flat();
 assert.ok(original.length>0);
 let calls=0;
 const handlers=Object.fromEntries([...new Set(original.map(t=>t.kind))].map(kind=>[kind,async()=>{calls++;return true;}]));
 for(const field of ['id','kind','target']){
  const tampered=original.map(t=>({...t}));
  tampered[0][field]='modified-value';
  await assert.rejects(executeCoordinatedRX(command,{approved:true,expectedTasks:tampered,handlers,initialCredits:25,maxParallel:2}),/approved plan mismatch/i);
 }
 await assert.rejects(executeCoordinatedRX(command,{approved:true,expectedTasks:[],handlers,initialCredits:25,maxParallel:2}),/approved plan mismatch/i);
 assert.equal(calls,0);
});
