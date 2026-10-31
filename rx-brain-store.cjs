'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {createBrainMemory}=require('./rx-brain-memory.cjs');
const MAX_BYTES=100000;
async function loadBrain(file){
 let raw;try{const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Invalid snapshot file');if(stat.size>MAX_BYTES)throw Error('Snapshot too large');raw=await fs.readFile(file,'utf8')}catch(e){if(e.code==='ENOENT')return createBrainMemory();throw e}
 if(Buffer.byteLength(raw)>MAX_BYTES)throw Error('Snapshot too large');
 const data=JSON.parse(raw);
 if(!data||data.schema!==1||data.kind!=='rx-brain-memory'||!Array.isArray(data.records))throw Error('Invalid snapshot');
 return createBrainMemory({initialRecords:data.records});
}
async function saveBrain(file,brain){
 const raw=JSON.stringify(brain.snapshot());
 if(Buffer.byteLength(raw)>MAX_BYTES)throw Error('Snapshot too large');
 await fs.mkdir(path.dirname(file),{recursive:true});
 const tmp=file+'.tmp-'+process.pid;
 try{await fs.writeFile(tmp,raw,{flag:'wx',mode:0o600});await fs.rename(tmp,file)}
 catch(e){await fs.rm(tmp,{force:true}).catch(()=>{});throw e}
}
module.exports={loadBrain,saveBrain};
