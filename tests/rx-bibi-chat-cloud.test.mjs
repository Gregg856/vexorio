import assert from 'node:assert/strict';
import {saveBibiChatSnapshot,loadBibiChatSnapshot} from '../rx-bibi-chat-cloud.mjs';
let stored=null;
const client={
 auth:{getUser:async()=>({data:{user:{id:'11111111-1111-4111-8111-111111111111'}},error:null})},
 from(name){
  assert.equal(name,'rx_bibi_chat_snapshots');
  return {
   upsert:async(record,options)=>{assert.equal(options.onConflict,'user_id');stored=record;return {error:null};},
   select(field){assert.equal(field,'turns');return {eq(field,id){assert.equal(field,'user_id');assert.equal(id,'11111111-1111-4111-8111-111111111111');return {maybeSingle:async()=>({data:stored,error:null})};}};}
  };
 }
};
assert.equal(await saveBibiChatSnapshot(client,['Cześć','Witaj']),true);
assert.deepEqual(await loadBibiChatSnapshot(client),['Cześć','Witaj']);
await assert.rejects(saveBibiChatSnapshot(client,['Niekompletna wiadomość']),TypeError);
await assert.rejects(saveBibiChatSnapshot(client,['','Witaj']),TypeError);
await assert.rejects(loadBibiChatSnapshot({auth:{getUser:async()=>({data:{user:null}})},from:client.from}),/Authentication required/);
console.log('RX BIBI #702 cloud chat adapter: PASS (mock only; no production write)');
