'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const yaml=fs.readFileSync('.github/workflows/rx-alarm.yml','utf8');
const script=yaml.split('          script: |\n')[1]?.split('\n').map(line=>line.startsWith('            ')?line.slice(12):line).join('\n');
assert.ok(script,'RX ALARM github-script block missing');
async function simulate(conclusion,existing=false){
 const calls=[];
 const run={name:'RX Meduza and Ant Task Board — dedicated read-only CI',run_number:55,head_sha:'abc123',html_url:'https://github.com/Gregg856/vexorio/actions/runs/55',conclusion};
 const github={paginate:async()=>existing?[{number:12,body:'<!-- RX-ALARM:'+run.name+' -->'}]:[],rest:{issues:{listForRepo(){},create:async args=>calls.push({type:'create',...args}),createComment:async args=>calls.push({type:'comment',...args})}}};
 if(['failure','timed_out','action_required'].includes(conclusion))await vm.runInNewContext('(async()=>{'+script+'})()',{context:{payload:{workflow_run:run},repo:{owner:'Gregg856',repo:'vexorio'}},github});
 return calls;
}
test('synthetic failure creates one actionable issue, without real GitHub writes',async()=>{
 const calls=await simulate('failure');
 assert.equal(calls.length,1);
 assert.equal(calls[0].type,'create');
 assert.match(calls[0].body,/rx-ant-ci-triage\.json/);
 assert.match(calls[0].body,/Diagnostyka Mrówek/);
 assert.match(calls[0].body,/55/);
 assert.match(calls[0].body,/nie naprawia/);
});
test('repeated failure comments on existing issue',async()=>{
 const calls=await simulate('failure',true);
 assert.equal(calls.length,1);
 assert.equal(calls[0].type,'comment');
 assert.equal(calls[0].issue_number,12);
});
test('timeout and action required trigger alarm; success does not',async()=>{
 for(const status of ['timed_out','action_required'])assert.equal((await simulate(status)).length,1);
 assert.equal((await simulate('success')).length,0);
});
