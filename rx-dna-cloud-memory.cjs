'use strict';
// RX DNA CLOUD MEMORY 4.0: backend-agnostic authenticated adapter.
// The caller MUST supply a trusted, durable compare-and-swap backend.
const {restoreDNALineage}=require('./rx-dna-lineage.cjs');
function createCloudLineage({authorize,read,compareAndSwap,maxBytes=1000000}={}){
 if([authorize,read,compareAndSwap].some(x=>typeof x!=='function')||!Number.isSafeInteger(maxBytes)||maxBytes<1000||maxBytes>2000000)throw Error('Invalid cloud adapters');
 async function check(session){if(await authorize(session)!==true)throw Error('RX DNA access denied');}
 function validate(snapshot){const raw=JSON.stringify(snapshot);if(!raw||Buffer.byteLength(raw)>maxBytes)throw Error('RX DNA cloud size limit');return restoreDNALineage(JSON.parse(raw)).snapshot();}
 return Object.freeze({
  async load(session,key){
   await check(session);if(typeof key!=='string'||!/^RXDNA-CLOUD-[A-Za-z0-9_-]{1,40}$/.test(key))throw Error('Invalid cloud key');
   const row=await read(key,session);
   if(row==null)return {revision:0,store:restoreDNALineage({schema:1,versions:[]})};
   if(!Number.isSafeInteger(row.revision)||row.revision<1)throw Error('Invalid cloud revision');
   return {revision:row.revision,store:restoreDNALineage(validate(row.snapshot))};
  },
  async save(session,key,store,expectedRevision){
   await check(session);if(typeof key!=='string'||!/^RXDNA-CLOUD-[A-Za-z0-9_-]{1,40}$/.test(key)||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||typeof store?.snapshot!=='function')throw Error('Invalid cloud save');
   const snapshot=validate(store.snapshot());
   const next=await compareAndSwap(key,snapshot,expectedRevision,session);
   if(!Number.isSafeInteger(next)||next!==expectedRevision+1)throw Error('RX DNA conflict or invalid revision');
   return {key,revision:next};
  }
 });
}
module.exports={createCloudLineage};
