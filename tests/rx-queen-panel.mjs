import assert from 'node:assert/strict';
import {createQueenPanelController} from '../rx-queen-panel.mjs';
const userId='22222222-2222-4222-8222-222222222222';
const reportId='11111111-1111-4111-8111-111111111111';
let saved;
const client={
 auth:{getUser:async()=>({data:{user:{id:userId}},error:null})},
 from:()=>({
  insert(row){saved=row;return {select(){return {single:async()=>({data:{id:reportId},error:null})}}}},
  select(){return {eq(){return {eq(){return {single:async()=>({data:{report:saved.report},error:null})}}}}}}
 })
};
const panel=createQueenPanelController(client);
assert.equal(panel.history().length,0);
const entry=panel.preview('Sprawdź testy i chmurę','preview');
assert.equal(entry.kind,'rx-queen-history-entry-v2');
assert.equal(entry.report.executionConnected,false);
assert.equal(saved,undefined);
assert.equal(await panel.save('first'),reportId);
assert.equal(saved.owner_id,userId);
assert.deepEqual(await panel.load(reportId),panel.history());
console.log('RX Queen panel controller OK');
