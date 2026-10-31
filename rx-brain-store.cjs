'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {createBrainMemory}=require('./rx-brain-memory.cjs');
const MAX_BYTES=100000;
async function loadBrain(file){
 let raw;try{const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Invalid snapshot file');if(stat.size>MAX_BYTES)throw Error('Snapshot too large');raw=await fs.readFile(file,'utf8')}catch(e){if(e.code==='ENOENT')return createBrainMemory();throw e}
 if(Buffer.byteLength(raw)>MAX_BYTES)throw Error('Snapshot too large');
 const data=JSON.parse(raw);
 if(!data||data.schema!==1||data.kind!=='rx-brain-memory'||data.trainedModel!==false||data.autoExecuted!==0||!Array.isArray(data.records))throw Error('Invalid snapshot');
 return createBrainMemory({initialRecords:data.records});
}
async function saveBrain(file,brain){
 const raw=JSON.stringify(brain.snapshot());
 if(Buffer.byteLength(raw)>MAX_BYTES)throw Error('Snapshot too large');
 await fs.mkdir(path.dirname(file),{recursive:true});
 const tmp=file+'.tmp-'+process.pid+'-'+require('node:crypto').randomBytes(8).toString('hex');
 try{await fs.writeFile(tmp,raw,{flag:'wx',mode:0o600});await fs.rename(tmp,file)}
 catch(e){await fs.rm(tmp,{force:true}).catch(()=>{});throw e}
}
// Serialize verified learning updates within one Node.js process per file.
const learningQueues=new Map();
function learnAndSaveBrain(file,observation){
 if(typeof file!=='string'||!file.trim())return Promise.reject(Error('Invalid memory path'));
 const key=path.resolve(file);
 const previous=learningQueues.get(key)||Promise.resolve();
 const current=previous.catch(()=>{}).then(async()=>{
  const brain=await loadBrain(key);
  const record=brain.learn(observation);
  await saveBrain(key,brain);
  return record;
 });
 const settled=current.then(()=>{},()=>{});
 learningQueues.set(key,settled);
 void settled.then(()=>{if(learningQueues.get(key)===settled)learningQueues.delete(key)});
 return current;
}
module.exports={loadBrain,saveBrain,learnAndSaveBrain};
