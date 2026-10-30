'use strict';
// RX BIBI customer dialogue baseline: measurement only, not a language-model training claim.
// Read the existing planner as-is; never dispatch admin tools or write user messages.
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const CASES=[
 {topic:'everyday',message:'Jak się masz?'},
 {topic:'everyday',message:'Mam pytanie'},
 {topic:'writing',message:'Napisz krótkie życzenia urodzinowe dla przyjaciela.'},
 {topic:'explanation',message:'Wyjaśnij, dlaczego niebo jest niebieskie.'},
 {topic:'followup',message:'A dlaczego?',history:['Dlaczego niebo jest niebieskie?','Potrzebuję więcej szczegółów.']},
 {topic:'translation',message:'Przetłumacz na niemiecki: Dzień dobry, jak się masz?'},
 {topic:'math',message:'Ile to jest 12 plus 8?'},
 {topic:'topic-switch',message:'Porozmawiajmy o muzyce.'}
];
(async()=>{
 const {planRXChat}=await import(pathToFileURL(path.resolve(__dirname,'../rx-chat-planner.mjs')).href);
 const results=CASES.map(({topic,message,history=[]})=>{
  const r=planRXChat(message,history);
  assert.equal(r.executed,0,'No client dialogue may execute admin tasks');
  assert.equal(typeof r.answer,'string');
  assert.ok(r.answer.trim());
  return {topic,message,answer:r.answer,contextUsed:r.contextUsed,modelInferenceUsed:r.modelInferenceUsed};
 });
 const fallback=results.filter(x=>/Nie rozumiem jeszcze|nie mam jeszcze silnika|nie tworzy jeszcze|nie mam wystarczajacej/i.test(x.answer));
 const report={schema:1,kind:'rx-client-dialogue-baseline',cases:results.length,unsupportedOrLimited:fallback.length,languageModel:false,results};
 process.stdout.write(JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
