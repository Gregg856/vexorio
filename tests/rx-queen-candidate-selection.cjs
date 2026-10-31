'use strict';
// Deterministic offline candidate selection: compare approved responses only.
const fs=require('node:fs'),path=require('node:path');
const {answer}=require('./rx-queen-response-practice.cjs');
const {compose}=require('./rx-queen-writing-composer.cjs');
const CASES=Object.freeze([
 {prompt:'cześć królowo',approved:'Cześć! W czym mogę pomóc?'},
 {prompt:'dzień dobry',approved:'Dzień dobry! Jak mogę pomóc?'},
 {prompt:'sprawdź testy',approved:'Mogę sprawdzić testy po otrzymaniu ich wyników. Nie potwierdzę sukcesu bez dowodu.'},
 {prompt:'czy jesteś połączona z serwerem',approved:'Nie mogę potwierdzić połączenia bez sprawdzenia stanu serwera.'},
 {prompt:'jak zbudować rakietę',approved:null}
]);
function score(candidate,expected){
 if(typeof candidate!=='string'||!candidate.trim()||candidate.length>600)return 0;
 if(expected===null)return /nie mam jeszcze wystarczających danych/i.test(candidate)?3:0;
 return candidate===expected?3:0;
}
function run(){
 const evaluations=CASES.map(item=>{
  const current=answer(item.prompt).text;
  const candidate=compose({prompt:item.prompt,mode:'answer'}).text;
  const baseline=score(current,item.approved),proposed=score(candidate,item.approved);
  const selected=proposed>baseline?'candidate':'baseline';
  return {prompt:item.prompt,baselineScore:baseline,candidateScore:proposed,selected,regressed:proposed<baseline};
 });
 const regressions=evaluations.filter(x=>x.regressed).length;
 return {schema:1,kind:'rx-queen-candidate-selection',status:regressions?'REVIEW':'PASS',evaluated:evaluations.length,regressions,improvements:evaluations.filter(x=>x.selected==='candidate').length,evaluations,autoApplied:0,productionConnected:false};
}
if(require.main===module){
 const report=run(),dir=path.join(__dirname,'..','rx-bibi-reports');
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'rx-queen-candidate-selection.json'),JSON.stringify(report,null,2)+'\n');
 console.log('RX QUEEN CANDIDATES',JSON.stringify({status:report.status,evaluated:report.evaluated,regressions:report.regressions,improvements:report.improvements}));
 if(report.status!=='PASS')process.exitCode=1;
}
module.exports={score,run,CASES};
