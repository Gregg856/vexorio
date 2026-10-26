'use strict';
const assert=require('node:assert/strict');
const {RXMillionHearts}=require('../rx-million-hearts.js');
const {RECIPES,executeRXCommand}=require('../rx-command-bridge.js');
(async()=>{
 const rx=new RXMillionHearts({maxConcurrent:1,maxQueue:1});
 const called=[];
 for(const name of ['code','security','tests','performance','diagnostics'])rx.register(name,async()=>{called.push(name);return {status:'checked'};});
 const report=await executeRXCommand(rx,' rx   audyt ');
 assert.equal(report.ok,true);
 assert.equal(report.requiresApproval,true);
 assert.deepEqual(called,['code','security','tests','performance']);
 assert.equal(report.steps.length,4);
 assert.equal(RECIPES['RX AUDYT'].length,4);
 await assert.rejects(executeRXCommand(rx,'RX DELETE EVERYTHING'),/Unknown RX command/);
 assert.equal(called.length,4);
 console.log('RX COMMAND BRIDGE 2076: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
