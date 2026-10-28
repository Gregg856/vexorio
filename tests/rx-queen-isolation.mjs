import assert from 'node:assert/strict';
import {saveQueenHistory,loadQueenHistory} from '../rx-queen-cloud.mjs';
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const reportId='33333333-3333-4333-8333-333333333333';
const rows=[];
function client(userId){
 return {
  auth:{getUser:async()=>({data:{user:{id:userId}},error:null})},
  from(table){
   assert.equal(table,'rx_queen_history');
   return {
    insert(row){if(row.owner_id!==userId)throw Error('RLS violation');rows.push({id:reportId,...row});return {select(){return {single:async()=>({data:{id:reportId},error:null})}}}},
    select(){let filters={};return {eq(key,value){filters[key]=value;return {eq(key2,value2){filters[key2]=value2;return {single:async()=>{const row=rows.find(r=>r.id===filters.id&&r.owner_id===filters.owner_id&&r.owner_id===userId);return row?{data:{report:row.report},error:null}:{data:null,error:{code:'PGRST116'}}}}}}}}
   };
  }
 };
}
const history=[];
await saveQueenHistory(client(A),history,'test A');
assert.deepEqual(await loadQueenHistory(client(A),reportId),history);
await assert.rejects(()=>loadQueenHistory(client(B),reportId),/History not accessible/);
assert.equal(rows.length,1);
console.log('RX staging-style user isolation contract OK (mock; not live DB)');
