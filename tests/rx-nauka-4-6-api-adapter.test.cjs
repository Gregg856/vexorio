const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBrainMemory}=require('../rx-brain-memory.cjs');
const {toBrainMemoryApi}=require('../rx-brain-api-adapter.cjs');
test('real Brain snapshot becomes existing BIBI API contract',()=>{
 const brain=createBrainMemory();
 brain.learn({key:'android_chat',action:'inspect_logs',success:true,evidence:'verified run 111'});
 brain.learn({key:'android_chat',action:'inspect_logs',success:false,evidence:'verified run 112'});
 const raw=brain.snapshot();
 const api=toBrainMemoryApi(raw);
 assert.deepEqual(api,{ok:true,kind:'rx-brain-memory',records:[{key:'android_chat',action:'inspect_logs',samples:2,successRate:0.5}]});
 assert.equal(raw.records[0].lastEvidence,'verified run 112');
 assert.equal(JSON.stringify(api).includes('lastEvidence'),false);
});
test('empty snapshot yields empty records',()=>assert.deepEqual(toBrainMemoryApi(createBrainMemory().snapshot()).records,[]));
test('rejects malformed and contradictory counters',()=>{
 const raw=createBrainMemory().snapshot();
 for(const record of [
  {key:'a',action:'x',successes:0,failures:0,lastEvidence:'evidence valid'},
  {key:'a',action:'x',successes:-1,failures:2,lastEvidence:'evidence valid'},
  {key:'a',action:'x',successes:1,failures:NaN,lastEvidence:'evidence valid'},
 ]){
  assert.throws(()=>toBrainMemoryApi({...raw,records:[record]}));
 }
});
test('rejects duplicated keys and invalid snapshot kind',()=>{
 const brain=createBrainMemory();brain.learn({key:'a',action:'x',success:true,evidence:'verified run 111'});
 const raw=brain.snapshot();
 assert.throws(()=>toBrainMemoryApi({...raw,records:[raw.records[0],raw.records[0]]}));
 assert.throws(()=>toBrainMemoryApi({...raw,kind:'unexpected'}));
});
