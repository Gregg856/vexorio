'use strict';
// RX DNA CLOUD 1.1 — server-only adapter. Never import into browser bundles.
// A trusted server supplies a privileged database client AFTER authenticating the Queen.
// This adapter deliberately does not handle credentials or grant access itself.
const ANT_ID=/^RX-[0-9]{6}$/;
function validateSnapshot(antId,snapshot){
 if(!ANT_ID.test(antId))throw new TypeError('Invalid ant ID');
 if(!snapshot||snapshot.version!==1||!Array.isArray(snapshot.ants)||snapshot.ants.length!==1)throw new TypeError('Invalid snapshot');
 const ant=snapshot.ants[0];
 if(!ant||ant.head!==antId||!Array.isArray(ant.entries)||ant.entries.length>8)throw new TypeError('Invalid ant entries');
 const seen=new Set();
 for(const entry of ant.entries){
  if(!entry||typeof entry.code!=='string'||!/^[a-z0-9_-]{1,48}$/i.test(entry.code)||typeof entry.fixId!=='string'||!/^[a-z0-9_-]{1,64}$/i.test(entry.fixId)||seen.has(entry.code))throw new TypeError('Invalid entry');
  seen.add(entry.code);
 }
 if(JSON.stringify(snapshot).length>12000)throw new RangeError('Snapshot too large');
 return {version:1,ants:[{head:antId,entries:ant.entries.map(({code,fixId})=>({code,fixId}))}]};
}
function createRXDNAStore({read,write,authorize}){
 if(typeof read!=='function'||typeof write!=='function'||typeof authorize!=='function')throw new TypeError('Server adapters required');
 const check=async context=>{if(await authorize(context)!==true)throw new Error('RX Queen authorization required')};
 return Object.freeze({
  async load(context,antId){
   await check(context);
   if(!ANT_ID.test(antId))throw new TypeError('Invalid ant ID');
   const record=await read(antId,context);
   if(record==null)return null;
   if(!Number.isSafeInteger(record.revision)||record.revision<1)throw new TypeError('Invalid revision');
   return {revision:record.revision,snapshot:validateSnapshot(antId,record.snapshot)};
  },
  async save(context,antId,snapshot,expectedRevision){
   await check(context);
   if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw new TypeError('Invalid expected revision');
   const clean=validateSnapshot(antId,snapshot);
   const revision=await write(antId,clean,expectedRevision,context);
   if(!Number.isSafeInteger(revision)||revision<=expectedRevision)throw new Error('Invalid storage revision');
   return {antId,revision};
  }
 });
}
if(typeof module!=='undefined'&&module.exports)module.exports={createRXDNAStore,validateSnapshot};
