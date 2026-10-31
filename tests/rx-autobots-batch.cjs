'use strict';
// RX AutoBots: unattended bounded batch using existing approved offline agent pipeline.
// Does not modify source code, deploy production, or access private conversations.
const fs=require('node:fs'),path=require('node:path');
const {runLearning}=require('./rx-learning-memory.cjs');
const OUT=path.resolve(__dirname,'../rx-bibi-reports');
const HISTORY=path.join(OUT,'rx-learning-history.json');
function historyState(){try{const d=JSON.parse(fs.readFileSync(HISTORY,'utf8'));return {count:Array.isArray(d.runs)?d.runs.length:0,lastId:Array.isArray(d.runs)?d.runs.at(-1)?.id||null:null};}catch(e){if(e.code==='ENOENT')return {count:0,lastId:null};throw e;}}
function batch({cycles=5,learn=runLearning}={}){
 if(!Number.isInteger(cycles)||cycles<1||cycles>10)throw Error('cycles must be 1..10');
 const results=[];
 const historyBefore=historyState();
 for(let i=0;i<cycles;i++){
  const started=Date.now();
  try{
   const result=learn();
   results.push({cycle:i+1,status:result.latest.status,correct:result.latest.correct,total:result.latest.total,durationMs:Date.now()-started});
   if(result.latest.status!=='PASS'||result.regressionDetected)break;
  }catch(error){results.push({cycle:i+1,status:'FAIL',error:String(error.message).slice(0,250),durationMs:Date.now()-started});break;}
 }
 const historyAfter=historyState();
 const report={historyBefore,historyAfter,historyPersisted:historyAfter.count>0,schema:1,kind:'rx-autobots-batch',createdAt:new Date().toISOString(),requested:cycles,completed:results.length,status:results.length===cycles&&results.every(r=>r.status==='PASS')?'PASS':'FAIL',productionConnected:false,autonomousCodeChanges:false,results};
 fs.mkdirSync(OUT,{recursive:true});
 fs.writeFileSync(path.join(OUT,'rx-autobots-batch.json'),JSON.stringify(report,null,2)+'\n');
 return report;
}
if(require.main===module){
 const count=Number(process.env.RX_AUTOBOTS_CYCLES||5);
 const report=batch({cycles:count});
 console.log('RX AUTOBOTS BATCH',JSON.stringify({status:report.status,completed:report.completed,requested:report.requested}));
 if(report.status!=='PASS')process.exitCode=1;
}
module.exports={batch};
