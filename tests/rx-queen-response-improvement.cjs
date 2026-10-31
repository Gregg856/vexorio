'use strict';
// Offline teacher generates concrete, reviewable proposals for weak writing cases.
// Never edits production responses or trains on private messages.
const fs=require('node:fs'),path=require('node:path');
const {CASES}=require('./rx-queen-writing-agent-review.cjs');
const {compose}=require('./rx-queen-writing-composer.cjs');
const PROBES=Object.freeze([
 {prompt:'Czy BIBI jest już wdrożona na serwerze?',mode:'answer',expected:'uncertain',topic:'deployment'},
 {prompt:'Napisz mi coś o nieznanym projekcie QXZ',mode:'answer',expected:'uncertain',topic:'unknown'},
 {prompt:'Sprawdź czy boty naprawdę działają',mode:'answer',expected:'uncertain',topic:'verification'},
 {prompt:'Podsumuj: Etap pierwszy. Etap drugi. Etap trzeci.',mode:'summary',expected:'summary',topic:'summary'}
]);
function improve(){
 const cases=[...CASES.map(c=>({prompt:c.prompt,mode:c.mode,expected:'known',topic:'approved'})),...PROBES];
 const results=cases.map(item=>{
  const result=compose({prompt:item.prompt,mode:item.mode});
  const shouldBeUncertain=item.expected==='uncertain';
  const passes=shouldBeUncertain?!result.matched:result.text.trim().length>0;
  return {prompt:item.prompt,mode:item.mode,topic:item.topic,passes,matched:result.matched,proposal:passes?null:{
   action:'review-approved-response-examples',topic:item.topic,
   reason:'Model matched an unsupported question; verify response and add approved training example only after human review.',
   approved:false,autoApplied:false
  }};
 });
 const failures=results.filter(r=>!r.passes);
 const report={schema:1,kind:'rx-queen-response-improvement',status:failures.length?'NEEDS_REVIEW':'PASS',tested:results.length,passed:results.length-failures.length,
  proposals:failures.map(r=>r.proposal),results,autoApplied:0,productionConnected:false};
 return report;
}
if(require.main===module){
 const result=improve(),dir=path.join(__dirname,'..','rx-bibi-reports');
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'rx-queen-response-improvement.json'),JSON.stringify(result,null,2)+'\n');
 console.log('RX QUEEN IMPROVEMENT',JSON.stringify({status:result.status,tested:result.tested,passed:result.passed,proposals:result.proposals.length}));
}
module.exports={improve,PROBES};
