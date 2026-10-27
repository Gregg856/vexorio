'use strict';
const fs=require('node:fs');
const path=require('node:path');
function updateHistory(previous,medusa,runId){
 if(!medusa||medusa.kind!=='rx-medusa-engine'||!Array.isArray(medusa.signals)||medusa.signals.length>500)throw Error('Invalid Medusa report');
 if(previous&&(!Array.isArray(previous.entries)||previous.kind!=='rx-signal-memory'||previous.entries.length>200))throw Error('Invalid memory');
 const entries=new Map((previous?.entries||[]).map(e=>[e.key,e]));
 const recurring=[];
 for(const s of medusa.signals){
  if(!s||typeof s.source!=='string'||typeof s.action!=='string'||typeof s.target!=='string')throw Error('Invalid signal');
  const key=JSON.stringify([s.source,s.action,s.target]);const old=entries.get(key);
  if(old?.lastRun===runId)continue;
  const seen=Math.min(1000000,(old?.seen||0)+1);
  entries.set(key,{key,seen,lastRun:runId});
  if(seen>1)recurring.push({source:s.source,action:s.action,target:s.target,seen});
 }
 return {schema:1,kind:'rx-signal-memory',entries:[...entries.values()].sort((a,b)=>b.seen-a.seen).slice(0,200),recurring:recurring.slice(0,100),autoFixesApplied:0};
}
if(require.main===module){
 const dir='rx-bibi-reports',file=path.join(dir,'rx-signal-memory.json');
 const medusa=JSON.parse(fs.readFileSync(path.join(dir,'rx-medusa-signals.json'),'utf8'));
 const cacheFile=path.join('rx-memory-cache','history.json');
 let previous=null;try{previous=JSON.parse(fs.readFileSync(cacheFile,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
 const result=updateHistory(previous,medusa,process.env.GITHUB_RUN_ID||'local');
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
 fs.mkdirSync('rx-memory-cache',{recursive:true});fs.writeFileSync(cacheFile,JSON.stringify(result,null,2)+'\n');
 console.log('RX MEMORY:',result.recurring.length,'recurring signals');
}
module.exports={updateHistory};
