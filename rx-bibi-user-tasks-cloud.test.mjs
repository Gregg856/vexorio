import test from 'node:test';
import assert from 'node:assert/strict';
import {listBibiTasks,deferBibiTask,completeBibiTask} from './rx-bibi-user-tasks-cloud.mjs';
test('refuses unauthenticated calls before querying data',async()=>{
 const client={auth:{getUser:async()=>({data:{user:null}})},from:()=>{throw Error('Must not query');}};
 await assert.rejects(()=>listBibiTasks(client),/Authentication required/);
 await assert.rejects(()=>deferBibiTask(client,'Test'),/Authentication required/);
});
test('refuses invalid title and task id',async()=>{
 const client={auth:{getUser:async()=>({data:{user:{id:'user-1'}}})},from:()=>{throw Error('Must not query');}};
 await assert.rejects(()=>deferBibiTask(client,' '),/Invalid task title/);
 await assert.rejects(()=>completeBibiTask(client,'../invalid'),/Invalid task id/);
});
test('user scoped read and insert on existing table',async()=>{
 const calls=[];
 const client={auth:{getUser:async()=>({data:{user:{id:'user-1'}}})},from:(table)=>{
  assert.equal(table,'rx_bibi_user_tasks');
  return {select:(...args)=>{calls.push(['select',...args]);return {eq:(key,value)=>{assert.equal(key,'user_id');assert.equal(value,'user-1');return {order:()=>({limit:async()=>({data:[],error:null})})};}};},
   insert:(record)=>{assert.equal(record.user_id,'user-1');assert.equal(record.status,'pending');return {select:()=>({single:async()=>({data:{id:'ok',title:record.title,status:'pending'},error:null})})};}};
 }};
 assert.deepEqual(await listBibiTasks(client),[]);
 assert.equal((await deferBibiTask(client,'Odłożony temat')).status,'pending');
});
