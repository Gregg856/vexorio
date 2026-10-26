'use strict';
const assert=require('node:assert/strict');
const {createRXDNAStore}=require('../rx-dna-store-server.cjs');
(async()=>{
 const records=new Map();let writes=0;
 const store=createRXDNAStore({
  authorize:async ctx=>ctx?.queen===true,
  read:async id=>records.get(id)||null,
  write:async(id,snapshot,expected)=>{
   const prev=records.get(id);
   if((prev?.revision||0)!==expected)throw new Error('Ant memory revision conflict');
   const revision=expected+1;records.set(id,{revision,snapshot});writes++;return revision;
  }
 });
 const snapshot={version:1,ants:[{head:'RX-000001',entries:[{code:'test_ok',fixId:'verified_1'}]}]};
 await assert.rejects(store.save({},'RX-000001',snapshot,0),/authorization/);
 assert.equal(writes,0);
 assert.equal((await store.save({queen:true},'RX-000001',snapshot,0)).revision,1);
 assert.equal((await store.load({queen:true},'RX-000001')).snapshot.ants[0].entries[0].fixId,'verified_1');
 await assert.rejects(store.save({queen:true},'RX-000001',snapshot,0),/revision conflict/);
 await assert.rejects(store.save({queen:true},'RX-000001',{...snapshot,ants:[{head:'RX-000002',entries:[]}]},1),/Invalid ant entries/);
 await assert.rejects(store.load({},'RX-000001'),/authorization/);
 assert.equal(writes,1);
 console.log('PASS RX DNA server store authorization, roundtrip, revision and validation');
})().catch(e=>{console.error(e);process.exitCode=1});
