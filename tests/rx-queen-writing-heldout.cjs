'use strict';
// Held-out evaluation: prompts are intentionally absent from the scheduled curriculum.
// This evaluates deterministic writing behavior, not model learning or semantic intelligence.
const {compose}=require('./rx-queen-writing-composer.cjs');
const {examine}=require('./rx-queen-writing-examiner.cjs');
const {CURRICULUM}=require('./rx-queen-writing-reviewed-batch.cjs');
const CASES=Object.freeze([
 {mode:'message',prompt:'dobrego wtorku',mustInclude:'Dobrego wtorku'},
 {mode:'message',prompt:'miłego popołudnia',mustInclude:'Miłego popołudnia'},
 {mode:'reply',prompt:'dziękuję za szybki kontakt',mustInclude:'Dziękuję za szybki kontakt'},
 {mode:'reply',prompt:'potwierdzam termin spotkania',mustInclude:'Potwierdzam termin spotkania'},
 {mode:'summary',prompt:'Odbierz paczkę. Sprawdź zawartość. Zachowaj paragon.',mustInclude:'Odbierz paczkę.'},
 {mode:'summary',prompt:'Włącz komputer. Otwórz program. Zapisz projekt.',mustInclude:'Włącz komputer.'}
]);
function evaluate(){
 const known=new Set(CURRICULUM.map(x=>x.mode+'|'+x.prompt.trim().toLocaleLowerCase('pl')));
 const results=CASES.map(item=>{
  const key=item.mode+'|'+item.prompt.trim().toLocaleLowerCase('pl');
  if(known.has(key))throw Error('Held-out case leaked into curriculum');
  const output=compose(item);
  const exam=examine({...item,text:output.text});
  return {mode:item.mode,caseKey:key,passed:exam.passed,score:exam.score,maximum:exam.maximum,failed:exam.failed,semanticAccuracyVerified:false,productionConnected:output.productionConnected};
 });
 return {schema:1,kind:'rx-bibi-held-out-writing-evaluation',cases:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,semanticAccuracyVerified:false,modelWeightsUpdated:false,results};
}
if(require.main===module){
 const report=evaluate();
 console.log(JSON.stringify(report,null,2));
 if(report.failed)process.exitCode=1;
}
module.exports={CASES,evaluate};
