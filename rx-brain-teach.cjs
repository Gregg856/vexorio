'use strict';
// RX NAUKA 5.2 — opt-in, evidence-backed learning using the existing RX Brain store.
const fs=require('node:fs/promises');
const path=require('node:path');
const {learnAndSaveBrain}=require('./rx-brain-store.cjs');
async function teachFromFile(observationFile,{memoryFile=process.env.RX_BRAIN_MEMORY_FILE}={}){
 if(typeof observationFile!=='string'||!observationFile.trim())throw Error('Observation file required');
 if(typeof memoryFile!=='string'||!memoryFile.trim())throw Error('RX_BRAIN_MEMORY_FILE required');
 const stat=await fs.lstat(observationFile);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)throw Error('Invalid observation file');
 const data=JSON.parse(await fs.readFile(observationFile,'utf8'));
 if(!data||data.verified!==true||typeof data.testReference!=='string'||data.testReference.length<8||data.testReference.length>160)throw Error('Verified test reference required');
 const {key,action,success,evidence}=data;
 if(typeof evidence!=='string'||!evidence.includes(data.testReference))throw Error('Evidence must include test reference');
 const record=await learnAndSaveBrain(path.resolve(memoryFile),{key,action,success,evidence});
 return {ok:true,key:record.key,samples:record.successes+record.failures,successRate:record.successes/(record.successes+record.failures)};
}
if(require.main===module){
 teachFromFile(process.argv[2]).then(result=>{process.stdout.write(JSON.stringify(result)+'\n');}).catch(error=>{process.stderr.write('RX learning rejected: '+error.message+'\n');process.exitCode=1;});
}
module.exports={teachFromFile};
