'use strict';
const assert=require('node:assert/strict');
const {createRXCloudComputer}=require('../rx-cloud-computer.cjs');
const c=createRXCloudComputer({maxTasks:2});
assert.equal(c.enqueue({id:'RXJOB-1',kind:'run_unit_tests',target:'tests/rx-ai-core.cjs'}).status,'pending');
assert.equal(c.enqueue({id:'RXJOB-2',kind:'inspect_ci',target:'vexorio'}).requiresApproval,true);
assert.equal(c.report().executed,0);
assert.equal(c.report().serverProvisioned,false);
assert.throws(()=>c.enqueue({id:'RXJOB-3',kind:'inspect_ci',target:'vexorio'}),/Invalid task/);
assert.throws(()=>createRXCloudComputer().enqueue({id:'RXJOB-x',kind:'shell',target:'bash'}),/Invalid task/);
assert.throws(()=>createRXCloudComputer().enqueue({id:'RXJOB-x',kind:'check_syntax',target:'../secret'}),/Invalid task/);
const list=c.list();list[0].status='done';assert.equal(c.list()[0].status,'pending');
console.log('PASS RX CLOUD COMPUTER bounded queue, no execution, safe targets');

const {executeRXCloudChecks}=require('../rx-coordinator.cjs');
assert.throws(()=>executeRXCloudChecks(),/Owner approval required/);
assert.throws(()=>executeRXCloudChecks({approved:true,execute:false}),/Owner approval required/);
assert.throws(()=>executeRXCloudChecks({approved:true,execute:true,maxChecks:3}),/Invalid cloud check budget/);
console.log('PASS RX BIBI 6.6 cloud bridge approval and limits');
