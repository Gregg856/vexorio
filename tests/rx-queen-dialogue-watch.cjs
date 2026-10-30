'use strict';
// RX BIBI: deterministic synthetic conversations with our own Queen planner.
// No production accounts, messages, external AI or private user data.
const fs=require('node:fs');
(async()=>{
 const {planRXChat}=await import('../rx-chat-planner.mjs');
 const cases=[
  {id:'hello',message:'Cześć',expected:/cześć|witaj|hej|królow/i},
  {id:'rx-help',message:'RX POMOC',expected:/RX DOT|RX MMUL|RX MADD/i},
  {id:'math-dot',message:'RX DOT: [1,2]; [3,4]',expected:/11|iloczyn skalarny/i},
  {id:'math-invalid',message:'RX DOT: [1,2]; [3]',expected:/Nieprawidłowe wektory/i},
  {id:'math-matrix',message:'RX MMUL: [[1,2]]; [[3],[4]]',expected:/11|MMUL/i},

  {id:'wishes',message:'Napisz życzenia dla mamy',expected:/Dla mamy:.*Wszystkiego najlepszego/i},
  {id:'proofread',message:'Popraw: witaj  świecie',expected:/Witaj świecie[.]/i},
  {id:'arithmetic',message:'Ile to 7 * 8?',expected:/56/},
  {id:'division-zero',message:'Oblicz 4 / 0',expected:/dzielenie przez zero/i},
  {id:'translation-honesty',message:'Przetłumacz na niemiecki: Miłego dnia',expected:/nie mam jeszcze silnika tłumaczeń/i},
  {id:'tests',message:'Jakie testy przeszły?',expected:/test|raport|wynik/i},
  {id:'ants',message:'Co robią Mrówki?',expected:/mrów|zadani/i},
  {id:'memory',message:'Czy pamiętasz rozmowę?',expected:/pamię|histori|kontekst/i},
  {id:'cloud',message:'Jak działa chmura?',expected:/cloudflare|chmur|github/i},
  {id:'errors',message:'Mam błąd w panelu',expected:/błęd|komunikat|raport|napraw/i},
  {id:'work-order',message:'Królowa zbuduj moduł RX',expected:/RX Developer|BIBI|plan/i,workExpected:true},
  {id:'learned-error',message:'Mam błąd w panelu',learning:{kind:'rx-queen-verified-learning',lessons:[{incidentId:'test-1',observation:'Przycisk czatu nie odpowiada',panelArea:'RX Admin'}]},expected:/Przycisk czatu nie odpowiada/},
  {id:'verified-lesson',message:'Jak sprawdzić stan RX?',learning:{kind:'rx-queen-verified-learning',lessons:[{verified:true,question:'Jak sprawdzić stan RX?',correctAnswer:'Odczytaj ostatni raport RX w panelu diagnostyki.'}]},expected:/Odczytaj ostatni raport RX/},
  {id:'unverified-lesson-rejected',message:'Ile to 7 * 8?',learning:{kind:'rx-queen-verified-learning',lessons:[{verified:false,question:'Ile to 7 * 8?',correctAnswer:'Nieprawda'}]},expected:/56/,forbidden:/Nieprawda/},
  {id:'followup',message:'Dalej',history:['Co robią Mrówki?'],expected:/mrów|zadani|plan/i},
  {id:'freeform-question',message:'Dlaczego niebo jest niebieskie?',expected:/./},
  {id:'freeform-creative',message:'Wymyśl historię o robocie i ogrodzie',expected:/./},
  {id:'freeform-typos',message:'Co mozesz zrobic z moim projketem?',expected:/./},
  {id:'freeform-long',message:'Opowiedz mi o planowaniu pracy. '.repeat(35),expected:/./},
  {id:'freeform-mixed',message:'Hej Królowo, jak działają testy i co z Mrówkami?',expected:/test|mrów|zadani|plan/i},
  {id:'test-result-honesty',message:'Czy testy przeszły?',expected:/sprawdź|raport|nie zgaduj|wynik/i,forbidden:/wszystkie testy (przeszły|są zielone)/i},
  {id:'memory-limits',message:'Czy pamiętasz rozmowę?',expected:/ograniczony|kontekst|ostatnich/i},
  {id:'error-no-fake-fix',message:'Mam błąd w panelu',expected:/opisz|wklej|raport|komunikat/i,forbidden:/już naprawiłam|naprawione|wdrożyłam/i},
  {id:'followup-context',message:'Dalej',history:['Co robią Mrówki?'],expected:/mrów|zadani|plan/i,contextExpected:true},
  {id:'status-no-live-claim',message:'Jaki jest status RX?',expected:/raport|status|stan|odśwież/i,forbidden:/wszystko działa bez błędów|wszystkie zadania wykonane/i},
  {id:'cloud-no-fake-deploy',message:'Czy RX CLOUD jest już uruchomiony?',expected:/cloud|wdroż|status|serwer|github/i,forbidden:/właśnie uruchomiłam|wdrożenie zakończone pomyślnie/i},
  {id:'ants-no-background',message:'Co robią Mrówki?',expected:/mrów|zadani/i,forbidden:/pracują teraz samodzielnie|wykonały wszystkie zadania/i},
  {id:'work-requires-approval',message:'Królowa napraw czat RX',expected:/zatwierdzen|plan|nie uruchomiłam/i,workExpected:true,forbidden:/już naprawiłam|zmiany wdrożone/i}
 ];
 const results=[];
 for(const c of cases){
  try{
   const result=planRXChat(c.message,c.history||[],c.learning||null);
   if(!result?.ok||typeof result.answer!=='string'||!result.answer.trim())throw Error('No usable answer');
   if(!c.expected.test(result.answer))throw Error('Answer not related to expected topic');
   if(c.forbidden?.test(result.answer))throw Error('Misleading or fabricated claim in answer');
   if(c.contextExpected&&result.contextUsed!==true)throw Error('Previous conversation context not used');
   if(result.executed!==0)throw Error('Unexpected execution');
   if(c.workExpected&&(!result.plan?.work||!result.plan.work.stages.some(x=>x.module==='RX BIBI')||result.plan.work.executed!==false))throw Error('Missing BIBI work verification');
   results.push({id:c.id,ok:true,contextUsed:!!result.contextUsed,answerLength:result.answer.length});
  }catch(e){results.push({id:c.id,ok:false,error:e.message});}
 }
 // RX BIBI: longer conversation and topic switch through the actual planner.
 // History follows the same bounded string contract as /api/rx/chat.
 const dialogue=[
  {message:'Co robią Mrówki?',expected:/mrów|zadani/i},
  {message:'Dalej',expected:/mrów|zadani|plan/i,context:true},
  {message:'Jak działa chmura?',expected:/chmur|cloudflare|github/i},
  {message:'Dalej',expected:/chmur|cloudflare|github|test|raport/i,context:true},
  {message:'Ile to 7 * 8?',expected:/56/},
  {message:'Mam błąd w panelu',expected:/błęd|komunikat|raport|opisz/i},
  {message:'Czy testy przeszły?',expected:/test|raport|wynik/i}
 ];
 const dialogueHistory=[];
 for(const [index,turn] of dialogue.entries()){
  try{
   const result=planRXChat(turn.message,dialogueHistory.slice(-20));
   if(!result.ok||!turn.expected.test(result.answer)||result.executed!==0)throw Error('Unexpected reply');
   if(turn.context&&result.contextUsed!==true)throw Error('Lost follow-up context');
   dialogueHistory.push(turn.message,result.answer);
   results.push({id:'long-dialogue-'+index,ok:true,contextUsed:!!result.contextUsed,answerLength:result.answer.length});
  }catch(e){results.push({id:'long-dialogue-'+index,ok:false,error:e.message});break;}
 }
 // Compound requests must preserve the ordered work plan, not overwrite it
 // with the generic work-order planner. No actual task execution here.
 const compoundCases=[
  {id:'compound-check-fix',message:'Sprawdź czat i napraw błędy w czacie',modules:['RX BIBI','RX Developer','RX BIBI']},
  {id:'compound-typos',message:'Sorawdz czat i zrib poprawke czatu',modules:['RX BIBI','RX Developer','RX BIBI']},
  {id:'compound-fix-only',message:'Napraw czat i przetestuj',modules:['RX BIBI','RX Developer','RX BIBI']},
  {id:'compound-no-fix',message:'Sprawdź czat i przetestuj panel',modules:[]}
 ];
 for(const c of compoundCases){
  try{
   const r=planRXChat(c.message);
   const stages=r.plan?.work?.stages||[];
   const actual=stages.map(x=>x.module);
   if(c.modules.length?actual.join('|')!==c.modules.join('|'):actual.some(x=>x==='RX Developer'))throw Error('Incorrect task ordering: '+actual.join(','));
   if(r.executed!==0||r.plan?.work?.executed===true||stages.some(x=>x.requiresApproval===false))throw Error('Unauthorized execution');
   if(c.modules.length&&(!r.answer.includes('RX Developer')||!r.answer.includes('RX BIBI')))throw Error('Answer omits planned modules');
   results.push({id:c.id,ok:true,stages:actual});
  }catch(e){results.push({id:c.id,ok:false,error:e.message});}
 }
 // Verify the real existing test executor stays approval-gated.
 const {runQueenApprovedChecks}=require('../rx-mega-cloud-computer.cjs');
 const queenPlan=planRXChat('Sprawdź czat i napraw błędy w czacie').plan.work;
 try{
  const denied=runQueenApprovedChecks(queenPlan,{approved:false,execute:true});
  const preview=runQueenApprovedChecks(queenPlan,{approved:true,execute:false});
  if(denied.executed!==0||preview.executed!==0||denied.productionModified||preview.codePatched||denied.deployed)throw Error('Unauthorized Queen execution');
  let rejected=false;
  try{runQueenApprovedChecks({...queenPlan,stages:[{module:'arbitrary',action:'run anything'}]},{approved:true,execute:true});}catch{rejected=true;}
  if(!rejected)throw Error('Unknown Queen executor was accepted');
  results.push({id:'queen-executor-approval-gate',ok:true});
 }catch(e){results.push({id:'queen-executor-approval-gate',ok:false,error:e.message});}
 // RX NAUKA 3.4: independent deterministic verification of candidate metadata.
 // A failing test proves a problem, NOT the correctness of a suggested answer.
 const lessonCandidates=results.filter(x=>!x.ok).slice(0,10).map(x=>({
  id:x.id,source:'synthetic-dialogue-test',observation:String(x.error||'Failed dialogue check').slice(0,250),
  status:'pending-review',verified:false
 }));
 const reviewed=lessonCandidates.map(x=>{
  const valid=/^[a-z0-9-]{1,80}$/i.test(x.id)&&x.observation.length>0&&x.observation.length<=250;
  return {...x,validation:valid?'valid-candidate':'invalid-candidate',
   status:valid?'pending-review':'rejected',verified:false};
 });
 const lessonReport={kind:'rx-lesson-candidates',generatedAt:new Date().toISOString(),
  candidates:reviewed,validated:reviewed.filter(x=>x.validation==='valid-candidate').length,
  rejected:reviewed.filter(x=>x.validation==='invalid-candidate').length,
  automaticallyApproved:0,modelTrained:false};
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-lesson-candidates.json',JSON.stringify(lessonReport,null,2)+'\n');
 if(lessonReport.candidates.some(x=>x.verified||x.status==='approved'))throw Error('Unverified lesson promoted');
 const report={kind:'rx-bibi-queen-dialogue',mode:'SYNTHETIC_LOCAL_PLANNER',authenticatedProductionChat:'NOT_TESTED',checkedAt:new Date().toISOString(),checks:results,ok:results.every(x=>x.ok)};
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-queen-dialogue.json',JSON.stringify(report,null,2)+'\n');
 console.log('RX BIBI QUEEN DIALOGUE',JSON.stringify(report));
 if(!report.ok)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
