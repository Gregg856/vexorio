import assert from 'node:assert/strict';
import {saveBibiChatSnapshot,loadBibiChatSnapshot} from '../rx-bibi-chat-cloud.mjs';
// In-memory owner-scoped mock. This verifies adapter behavior, NOT database RLS.
const store=new Map();
const makeClient=id=>({
 auth:{getUser:async()=>({data:{user:{id}},error:null})},
 from(table){
  assert.equal(table,'rx_bibi_chat_snapshots');
  return {
   upsert:async(row,opts)=>{
    assert.equal(opts.onConflict,'user_id');
    if(row.user_id!==id)return {error:new Error('owner mismatch')};
    store.set(id,{turns:row.turns});
    return {error:null};
   },
   select(field){
    assert.equal(field,'turns');
    return {eq(column,owner){
     assert.equal(column,'user_id');
     return {maybeSingle:async()=>({data:owner===id?store.get(id)||null:null,error:null})};
    }};
   }
  };
 }
});
const a=makeClient('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
const b=makeClient('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
await saveBibiChatSnapshot(a,['Pamiętaj A','Odpowiedź A']);
assert.deepEqual(await loadBibiChatSnapshot(a),['Pamiętaj A','Odpowiedź A']);
assert.deepEqual(await loadBibiChatSnapshot(b),[]);
await saveBibiChatSnapshot(b,['Pamiętaj B','Odpowiedź B']);
assert.deepEqual(await loadBibiChatSnapshot(a),['Pamiętaj A','Odpowiedź A']);
assert.deepEqual(await loadBibiChatSnapshot(b),['Pamiętaj B','Odpowiedź B']);
await assert.rejects(saveBibiChatSnapshot(a,['Nieparzysta historia']),TypeError);
console.log('PASS: two-owner mock isolation, bounded history and independent restore; database RLS still needs live auth testing');
