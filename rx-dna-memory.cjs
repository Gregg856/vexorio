'use strict';
// Durable file adapter: explicitly invoked, atomic rename on same filesystem.
const fs=require('node:fs/promises');
const path=require('node:path');
const {restoreDNALineage}=require('./rx-dna-lineage.cjs');
async function saveLineage(filePath,store){
 const data=JSON.stringify(store.snapshot());
 if(Buffer.byteLength(data)>2_000_000)throw Error('DNA snapshot too large');
 const temp=filePath+'.tmp-'+process.pid;
 try{await fs.writeFile(temp,data,{flag:'wx',mode:0o600});await fs.rename(temp,filePath);}
 catch(e){await fs.rm(temp,{force:true}).catch(()=>{});throw e;}
}
async function loadLineage(filePath,limits={}){
 const stat=await fs.stat(filePath);
 if(stat.size>2_000_000)throw Error('DNA snapshot too large');
 const raw=await fs.readFile(filePath,'utf8');
 return restoreDNALineage(JSON.parse(raw),limits);
}
module.exports={saveLineage,loadLineage};
