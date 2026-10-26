'use strict';
const assert=require('node:assert/strict');
const {createCloudLineage}=require('../rx-dna-cloud-memory.cjs');
(async()=>{
 const records=new Map();
 const cloud=createCloudLineage({
  authorize:async s=>s?.role==='admin',
  read:async k=>records.get(k)||null,
  compareAndSwap:async(k,snapshot,expected)=>{
   const old=records.get(k),rev=old?.revision||0;
   if(rev!==expected)throw Error('RX DNA conflict');
   records.set(k,{revision:rev+1,snapshot});return rev+1;
  }
 });
 const key='RXDNA-CLOUD-queen',admin={role:'admin'};
 await assert.rejects(()=>cloud.load({role:'guest'},key),/access denied/);
 const {store}=await cloud.load(admin,key);
 store.register({id:'RXDNA-root',approved:true,testsPassed:true});
 assert.equal((await cloud.save(admin,key,store,0)).revision,1);
 const restored=await cloud.load(admin,key);
 assert.deepEqual(restored.store.snapshot(),store.snapshot());
 await assert.rejects(()=>cloud.save(admin,key,store,0),/conflict/);
 assert.equal(records.size,1);
 console.log('PASS RX cloud lineage auth, restore and optimistic concurrency (mock backend)');
})().catch(e=>{console.error(e);process.exitCode=1});
