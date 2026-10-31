'use strict';
// Detect missing or stale training-history evidence without exposing user data.
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
function inspect({directory=path.join(ROOT,'rx-bibi-reports')}={}){
 const batch=JSON.parse(fs.readFileSync(path.join(directory,'rx-autobots-batch.json'),'utf8'));
 const history=JSON.parse(fs.readFileSync(path.join(directory,'rx-learning-history.json'),'utf8'));
 const runs=Array.isArray(history.runs)?history.runs:[];
 const issues=[];
 if(batch.status!=='PASS')issues.push('BATCH_FAILED');
 if(!batch.historyPersisted||runs.length===0)issues.push('HISTORY_EMPTY');
 if(batch.historyAfter?.lastId!==runs.at(-1)?.id)issues.push('HISTORY_MISMATCH');
 if(batch.historyBefore?.count>0&&batch.historyAfter?.count===0)issues.push('HISTORY_LOST');
 return {schema:1,kind:'rx-autobots-memory-watchdog',status:issues.length?'ALERT':'PASS',issues,historyCount:runs.length,checkedAt:new Date().toISOString(),productionConnected:false};
}
if(require.main===module){
 try{const result=inspect();console.log(JSON.stringify(result));if(result.status!=='PASS')process.exitCode=1;}
 catch(e){console.error('RX MEMORY WATCHDOG',String(e.message));process.exitCode=1;}
}
module.exports={inspect};
