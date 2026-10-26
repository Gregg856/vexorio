'use strict';
// RX STELLAR LAB: deterministic astronomy data triage, no telescope access or model training.
function createStellarLab({maxObservations=1000}={}){
 if(!Number.isSafeInteger(maxObservations)||maxObservations<1||maxObservations>100000)throw Error('Invalid capacity');
 const observations=new Map();
 function add({id,source,starId,brightness,unit='relative',observedAt}){
  if(typeof id!=='string'||!/^OBS-[A-Za-z0-9_-]{1,64}$/.test(id)||typeof source!=='string'||source.length<2||source.length>120||typeof starId!=='string'||starId.length<1||starId.length>120||!Number.isFinite(brightness)||brightness<0||brightness>1e12||unit!=='relative'||typeof observedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(observedAt)||!Number.isFinite(Date.parse(observedAt)))throw Error('Invalid observation');
  const existing=observations.get(id);
  if(existing){if(JSON.stringify(existing)!==JSON.stringify({id,source,starId,brightness,unit,observedAt}))throw Error('Observation collision');return structuredClone(existing);}
  if(observations.size>=maxObservations)throw Error('Observation capacity reached');
  const entry={id,source,starId,brightness,unit,observedAt};observations.set(id,entry);return structuredClone(entry);
 }
 function summarize(starId){
  const entries=[...observations.values()].filter(x=>x.starId===starId).sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
  if(!entries.length)return null;
  const values=entries.map(x=>x.brightness);
  const min=Math.min(...values),max=Math.max(...values),mean=values.reduce((a,b)=>a+b,0)/values.length;
  return {starId,count:entries.length,min,max,mean,range:max-min};
 }
 return Object.freeze({add,summarize,count:()=>observations.size});
}
module.exports={createStellarLab};
