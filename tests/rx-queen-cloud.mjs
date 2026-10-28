import assert from 'node:assert/strict';
import {saveQueenHistory,loadQueenHistory} from '../rx-queen-cloud.mjs';
import {prepareQueenHandoff} from '../rx-queen-approval.mjs';
import {appendQueenReport} from '../rx-queen-history.mjs';
const history=appendQueenReport([],prepareQueenHandoff('Sprawdź testy i chmurę'),'first');
const id='11111111-1111-4111-8111-111111111111';
const owner='22222222-2222-4222-8222-222222222222';
let stored;
const client={
 auth:{getUser:async()=>({data:{user:{id:owner}},error:null})},
 from:()=>({
  insert(row){stored=row;return {select(){return {single:async()=>({data:{id},error:null})}}}},
  select(){return {eq(){return {eq(){return {single:async()=>({data:{report:stored.report},error:null})}}}}}}
 })
};
assert.equal(await saveQueenHistory(client,history,'test'),id);
assert.equal(stored.owner_id,owner);
assert.deepEqual(await loadQueenHistory(client,id),history);
await assert.rejects(()=>loadQueenHistory(client,'invalid'),TypeError);
await assert.rejects(()=>saveQueenHistory({...client,auth:{getUser:async()=>({data:null,error:null})}},history,'test'),/Authentication required/);
console.log('RX Queen cloud adapter OK');
