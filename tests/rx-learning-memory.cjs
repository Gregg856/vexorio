'use strict';
// Offline RX BIBI learning queue and bounded history. No user chat data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {runCycle}=require('./rx-agent-manager.cjs');
const {createLearner,evaluateHeldOut,HELD_OUT}=require('../rx-text-learner.cjs');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(ROOT,'rx-bibi-reports');
const HISTORY=path.join(DIR,'rx-learning-history.json');
const TASKS=Object.freeze([
 {id:'train-and-evaluate',role:'nauczyciel',priority:1},
 {id:'regression-check',role:'tester',priority:2,after:'train-and-evaluate'},
 {id:'safety-check',role:'strazak',priority:2,after:'train-and-evaluate'},
 {id:'review-results',role:'weryfikator',priority:3,after:'regression-check'}
]);
function queue(){return TASKS.map(t=>({...t,status:'QUEUED'}));}
function nextExercise(errors){
 const byLabel=new Map();
 for(const e of errors){byLabel.set(e.expected,(byLabel.get(e.expected)||0)+1);}
 return [...byLabel].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||'generalization';
}
function readHistory(){
 try{
  const data=JSON.parse(fs.readFileSync(HISTORY,'utf8'));
  return Array.isArray(data.runs)?data.runs.slice(-19):[];
 }catch(e){if(e.code==='ENOENT')return [];throw e;}
}
function runLearning(){
 fs.mkdirSync(DIR,{recursive:true});
 const cycle=runCycle();
 const gate=JSON.parse(fs.readFileSync(path.join(DIR,'rx-learning-gate.json'),'utf8'));
 const best=gate.candidates[0];
 const baseline=gate.baseline;
 const previous=readHistory();
 const record={
  id:crypto.randomUUID(),at:new Date().toISOString(),status:cycle.status,
  winner:gate.winner,correct:best.correct,total:best.total,
  baselineCorrect:baseline.correct,improvement:gate.improvementOverBaseline,
  nextExercise:nextExercise(best.errors),trainingData:'approved-static-only',
  tasks:queue().map(t=>({...t,status:cycle.jobs.find(j=>j.role===t.role)?.status||'UNKNOWN'}))
 };
 const runs=[...previous,record];
 fs.writeFileSync(HISTORY,JSON.stringify({schema:1,kind:'rx-learning-history',runs},null,2)+'\n');
 const previousBest=previous.length?Math.max(...previous.map(r=>r.correct)):-1;
 const summary={schema:1,kind:'rx-learning-progress',latest:record,
  previousBest:previousBest<0?null:previousBest,
  improvedOverHistory:previousBest>=0&&record.correct>previousBest,
  plateau:previous.length>=3&&previous.slice(-3).every(r=>r.correct>=record.correct),
  historyCount:runs.length,productionConnected:false};
 fs.writeFileSync(path.join(DIR,'rx-learning-progress.json'),JSON.stringify(summary,null,2)+'\n');
 console.log('RX BIBI LEARNING MEMORY',JSON.stringify({status:record.status,correct:record.correct,total:record.total,nextExercise:record.nextExercise,historyCount:runs.length}));
 if(cycle.status!=='PASS')process.exitCode=1;
 return summary;
}
if(require.main===module)runLearning();
module.exports={queue,nextExercise,runLearning};
