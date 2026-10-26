'use strict';
// RX DNA CLOUD 1.0 — portable, private, offline-first DNA manifest.
// This module does not create cloud storage, keys, accounts or autonomous AI.
const RX_DNA_VERSION=1;
const RX_DNA_ROLES=Object.freeze(['tests','diagnostics','code','security','performance','memory']);
function createAntDNA(index,{role='diagnostics',memorySlots=8}={}){
 if(!Number.isSafeInteger(index)||index<0||index>=1000000)throw new RangeError('Invalid ant index');
 if(!RX_DNA_ROLES.includes(role))throw new TypeError('Unknown ant role');
 if(!Number.isSafeInteger(memorySlots)||memorySlots<1||memorySlots>8)throw new RangeError('Invalid memory slots');
 const id='RX-'+String(index+1).padStart(6,'0');
 return Object.freeze({schema:RX_DNA_VERSION,id,dna:'RX-DNA-ANT-'+String(index+1).padStart(6,'0')+'-V1',role,memorySlots,canDeploy:false,canWriteProduction:false,requiresQueenApproval:true});
}
function validateAntDNA(value){
 if(!value||typeof value!=='object'||typeof value.id!=='string'||!/^RX-\d{6}$/.test(value.id))throw new TypeError('Invalid DNA');
 const index=Number(value.id.slice(3))-1;
 const expected=createAntDNA(index,{role:value.role,memorySlots:value.memorySlots});
 if(Object.keys(value).sort().join('|')!==Object.keys(expected).sort().join('|')||Object.keys(expected).some(key=>value[key]!==expected[key]))throw new TypeError('Modified DNA');
 return expected;
}
function createDNABackup(dna,antMemory){
 const verified=validateAntDNA(dna);
 if(!antMemory||antMemory.version!==1||!Array.isArray(antMemory.ants))throw new TypeError('Invalid memory snapshot');
 const match=antMemory.ants.find(ant=>ant.head===verified.id);
 if(!match||!Array.isArray(match.entries)||match.entries.length>verified.memorySlots)throw new TypeError('Missing or oversized ant memory');
 const entries=match.entries.map(item=>{
  if(!item||typeof item.code!=='string'||!/^[a-z0-9_-]{1,48}$/i.test(item.code)||typeof item.fixId!=='string'||!/^[a-z0-9_-]{1,64}$/i.test(item.fixId))throw new TypeError('Invalid memory entry');
  return {code:item.code,fixId:item.fixId};
 });
 if(new Set(entries.map(x=>x.code)).size!==entries.length)throw new TypeError('Duplicate memory entry');
 return {version:1,dna:verified,memory:{version:1,ants:[{head:verified.id,entries}]}};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createAntDNA,validateAntDNA,createDNABackup};
if(typeof window!=='undefined')window.RXDNACore={createAntDNA,validateAntDNA,createDNABackup};
