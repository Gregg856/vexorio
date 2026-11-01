'use strict';
// Negative-control evaluation. These prompts require interpretation, not copying.
// Record the gap without failing CI: the current composer is deliberately rule-based.
const {compose}=require('./rx-queen-writing-composer.cjs');
const {examine}=require('./rx-queen-writing-examiner.cjs');
const CHALLENGES=Object.freeze([
 {id:'no-greeting',mode:'message',prompt:'Napisz krótką wiadomość bez powitania: spotkanie o 15:00.',mustNotContain:'Cześć!'},
 {id:'no-signoff',mode:'reply',prompt:'Odpowiedz bez pożegnania: otrzymałem dokument.',mustNotContain:'Pozdrawiam!'},
 {id:'one-sentence-summary',mode:'summary',prompt:'Streszcz w jednym zdaniu: Najpierw sprawdź plik. Potem zapisz wynik. Na końcu zamknij program.',maxSentences:1},
 {id:'no-verbatim',mode:'message',prompt:'Przepisz sens bez cytowania: jutro spotkanie o ósmej.',mustNotContain:'Przepisz sens bez cytowania',requiresSemanticRewrite:true}
]);
function evaluateGap(){
 const results=CHALLENGES.map(c=>{
  const output=compose({prompt:c.prompt,mode:c.mode});
  const sentences=(output.text.match(/[^.!?]+[.!?]+/gu)||[]).length;
  const meetsConstraint=(!c.mustNotContain||!output.text.includes(c.mustNotContain))&&(!c.maxSentences||sentences<=c.maxSentences)&&(!c.requiresSemanticRewrite||(output.matched===true&&output.requiresClarification!==true&&output.source!=='local-semantic-limit'));
  // Generic examiner is not a semantic judge; report its result separately.
  const exam=examine({prompt:c.prompt,mode:c.mode,text:output.text,mustInclude:''});
  return {id:c.id,mode:c.mode,meetsConstraint,genericExamPassed:exam.passed,semanticRewriteClaimed:output.matched===true&&output.source!=='local-semantic-limit',productionConnected:output.productionConnected};
 });
 return {schema:1,kind:'rx-bibi-semantic-gap',total:results.length,constraintsMet:results.filter(x=>x.meetsConstraint).length,constraintsFailed:results.filter(x=>!x.meetsConstraint).length,semanticUnderstandingVerified:false,modelWeightsUpdated:false,results};
}
if(require.main===module)console.log(JSON.stringify(evaluateGap(),null,2));
module.exports={CHALLENGES,evaluateGap};
