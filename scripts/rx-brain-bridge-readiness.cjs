#!/usr/bin/env node
'use strict';
// Offline, read-only RX Brain bridge readiness check. Never print secrets.
const fs=require('node:fs');
const path=require('node:path');
const {createBrainMemory}=require('../rx-brain-memory.cjs');
let failed=false;
function check(label,ok){console.log((ok?'OK  ':'WARN ')+label);if(!ok)failed=true;}
const token=process.env.RX_QUEEN_LOCAL_TOKEN||'';
check('private token configured (>=32 characters)',token.length>=32);
let urlOk=false;
try{
 const u=new URL(process.env.RX_CLOUD_BRAIN_MEMORY_URL||'');
 urlOk=u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash&&u.pathname==='/__rxcloud/bibi/brain-memory'&&!!u.hostname&&u.hostname!=='localhost'&&!u.hostname.endsWith('.localhost');
}catch{}
check('HTTPS RX CLOUD brain-memory URL configured',urlOk);
const file=path.resolve(process.env.RX_BRAIN_MEMORY_FILE||path.join(__dirname,'..','rx-cloud-private-inbox','rx-brain-memory.json'));
let fileOk=false,recordCount=0;
try{
 const stat=fs.lstatSync(file);
 if(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=100000){
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  if(data?.schema===1&&data.kind==='rx-brain-memory'&&Array.isArray(data.records)){
   createBrainMemory({initialRecords:data.records});
   fileOk=true;recordCount=data.records.length;
  }
 }
}catch{}
check('private RX Brain snapshot exists and validates',fileOk);
if(fileOk)console.log('INFO memory records: '+recordCount);
console.log('No network requests, files, secrets or production settings were changed.');
console.log(failed?'RESULT: NOT READY':'RESULT: LOCAL CONFIG READY; live HTTPS/auth/chat still unverified');
process.exitCode=failed?1:0;
