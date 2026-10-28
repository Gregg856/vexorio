'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {assertTask,queueClient}=require('../rx/autopraca/staging-queue-adapter.cjs');
const valid={source:'queen_chat',task_type:'ci_status',title:'Sprawdź CI',payload:{workflow:'rx-coordinator-cloud.yml'}};
test('allowlisted task is normalized',()=>assert.equal(assertTask(valid).task_type,'ci_status'));
test('rejects arbitrary command injection',()=>{
 for(const payload of [{workflow:'deploy.yml'},{command:'rm -rf /'},{workflow:'rx-coordinator-cloud.yml',args:['--prod']}])
  assert.throws(()=>assertTask({...valid,payload}));
});
test('rejects invalid source and prototype',()=>{
 assert.throws(()=>assertTask({...valid,source:'guest'}));
 assert.throws(()=>assertTask({...valid,payload:[]}));
});
function mockDb() {
 const state={calls:[],status:'pending_approval'};
 const query={
  insert(v){state.calls.push(['insert',v]);return this},
  update(v){state.calls.push(['update',v]);return this},
  eq(k,v){state.calls.push(['eq',k,v]);return this},
  select(){return this},order(){return this},limit(){return this},
  single:async()=>({data:{id:'task-1',status:'pending_approval'},error:null}),
  maybeSingle:async()=>({data:state.status==='pending_approval'?{id:'task-1',status:'approved'}:null,error:null}),
  then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}
 };
 return {state,client:{schema(s){assert.equal(s,'rx_private');return {from(t){assert.equal(t,'ant_task_queue');return query}}}}};
}
test('enqueue always starts pending approval',async()=>{
 const {state,client}=mockDb();
 const result=await queueClient(client).enqueue(valid,'admin-1');
 assert.equal(result.status,'pending_approval');
 assert.equal(state.calls[0][1].status,'pending_approval');
});
test('approval checks pending status',async()=>{
 const {state,client}=mockDb();
 await queueClient(client).approve('00000000-0000-4000-8000-000000000001','admin-1');
 assert.ok(state.calls.some(x=>x[0]==='eq'&&x[1]==='status'&&x[2]==='pending_approval'));
});
test('approval rejects invalid IDs',async()=>{
 const {client}=mockDb();
 await assert.rejects(queueClient(client).approve('oops','admin-1'));
});
