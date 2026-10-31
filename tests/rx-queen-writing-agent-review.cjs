'use strict';
// Offline RX Queen writing review: tester, teacher, guard and verifier.
// Only approved fixed prompts; never reads private chat messages.
const fs=require('node:fs'),path=require('node:path');
const {compose}=require('./rx-queen-writing-composer.cjs');
const CASES=Object.freeze([
 {prompt:'cześć królowo',mode:'answer',mustInclude:'Cześć'},
 {prompt:'czy jesteś połączona z serwerem',mode:'answer',mustInclude:'Nie mogę potwierdzić'},
 {prompt:'miłego dnia',mode:'message',mustInclude:'Miłego dnia'},
 {prompt:'dziękuję za wiadomość',mode:'reply',mustInclude:'Dziękuję'},
 {prompt:'Pierwsze. Drugie. Trzecie.',mode:'summary',mustInclude:'Pierwsze. Drugie.'},
 {prompt:'jak zbudować rakietę',mode:'answer',mustInclude:'Nie mam jeszcze'}
]);
function review(){
 const results=CASES.map(item=>{
  const response=compose(item);
  const checks={
   nonempty:typeof response.text==='string'&&response.text.trim().length>0,
   bounded:response.text.length<=600,
   relevant:response.text.includes(item.mustInclude),
   noProductionClaim:response.productionConnected===false,
   noFabricatedServerStatus:!(/połączona z serwerem/.test(item.prompt))||response.text.includes('Nie mogę potwierdzić')
  };
  return {mode:item.mode,checks,pass:Object.values(checks).every(Boolean)};
 });
 const passed=results.filter(r=>r.pass).length;
 const report={schema:1,kind:'rx-queen-writing-agent-review',roles:['nauczyciel','tester','strazak','weryfikator'],status:passed===results.length?'PASS':'FAIL',passed,total:results.length,results,productionConnected:false,autonomousCodeChanges:false};
 return report;
}
if(require.main===module){
 const result=review(),dir=path.join(__dirname,'..','rx-bibi-reports');
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'rx-queen-writing-agent-review.json'),JSON.stringify(result,null,2)+'\n');
 console.log('RX QUEEN WRITING REVIEW',JSON.stringify({status:result.status,passed:result.passed,total:result.total}));
 if(result.status!=='PASS')process.exitCode=1;
}
module.exports={review,CASES};
