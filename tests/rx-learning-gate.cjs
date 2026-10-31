'use strict';
// Offline RX BIBI learning gate: reproducible training, held-out scoring and safe artifact.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createLearner,evaluateHeldOut,HELD_OUT,EXAMPLES}=require('../rx-text-learner.cjs');
const candidates=[
 {id:'frequency-base',features:'frequency',epochs:180,hidden:24,rate:0.06},
 {id:'bigram-base',features:'bigram',epochs:180,hidden:24,rate:0.06},
 {id:'bigram-wide',features:'bigram',epochs:240,hidden:32,rate:0.05},
 {id:'frequency-wide',features:'frequency',epochs:240,hidden:32,rate:0.05}
];
const report={schema:1,kind:'rx-bibi-offline-learning-gate',generatedAt:new Date().toISOString(),
 dataset:{trainingExamples:EXAMPLES.length,heldOut:HELD_OUT.length,sha256:crypto.createHash('sha256').update(JSON.stringify(EXAMPLES)).digest('hex')},
 candidates:[],promoted:false,productionConnected:false};
for(const config of candidates){
 const model=createLearner(config);
 const score=evaluateHeldOut(model);
 report.candidates.push({id:config.id,config,correct:score.correct,total:score.total,accuracy:score.accuracy,perLabel:score.perLabel,errors:score.cases.filter(c=>c.expected!==c.predicted)});
}
report.candidates.sort((a,b)=>b.correct-a.correct||a.id.localeCompare(b.id));
report.winner=report.candidates[0].id;
report.baseline=report.candidates.find(c=>c.id==='frequency-base');
report.improvementOverBaseline=report.candidates[0].correct-report.baseline.correct;
report.status=report.improvementOverBaseline>0?'IMPROVED_OFFLINE':'NO_MEASURED_IMPROVEMENT';
const output=path.join('rx-bibi-reports','rx-learning-gate.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('RX LEARNING:',JSON.stringify({status:report.status,winner:report.winner,baseline:report.baseline.correct,best:report.candidates[0].correct,total:HELD_OUT.length,productionConnected:false}));
if(report.candidates.some(c=>!Number.isFinite(c.accuracy)))process.exitCode=1;
