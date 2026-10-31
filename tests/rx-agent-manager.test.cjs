'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {plan,runCycle}=require('./rx-agent-manager.cjs');
test('RX manager plans four distinct agents',()=>{
 const jobs=plan();assert.equal(jobs.length,4);
 assert.equal(new Set(jobs.map(j=>j.id)).size,4);
 assert.ok(jobs.every(j=>j.status==='PENDING'));
});
test('RX manager requires training before regression and safety',()=>{
 const jobs=plan();const training=jobs.find(j=>j.id==='nauczyciel');
 assert.deepEqual(training.dependsOn,[]);
 assert.ok(jobs.find(j=>j.id==='tester').dependsOn.includes('nauczyciel'));
 assert.ok(jobs.find(j=>j.id==='weryfikator').dependsOn.includes('tester'));
});
test('RX manager dry run does not execute commands or write artifacts',()=>{
 const report=runCycle({execute:false});
 assert.equal(report.status,'PLANNED');
 assert.equal(report.productionConnected,false);
 assert.equal(report.autonomousCodeChanges,false);
 assert.equal(report.jobs.length,4);
});
