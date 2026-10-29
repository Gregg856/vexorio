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
  {id:'followup',message:'Dalej',history:['Co robią Mrówki?'],expected:/mrów|zadani|plan/i},
  {id:'freeform-question',message:'Dlaczego niebo jest niebieskie?',expected:/./},
  {id:'freeform-creative',message:'Wymyśl historię o robocie i ogrodzie',expected:/./},
  {id:'freeform-typos',message:'Co mozesz zrobic z moim projketem?',expected:/./},
  {id:'freeform-long',message:'Opowiedz mi o planowaniu pracy. '.repeat(35),expected:/./},
  {id:'freeform-mixed',message:'Hej Królowo, jak działają testy i co z Mrówkami?',expected:/test|mrów|zadani|plan/i}
 ];
 const results=[];
 for(const c of cases){
  try{
   const result=planRXChat(c.message,c.history||[],c.learning||null);
   if(!result?.ok||typeof result.answer!=='string'||!result.answer.trim())throw Error('No usable answer');
   if(!c.expected.test(result.answer))throw Error('Answer not related to expected topic');
   if(result.executed!==0)throw Error('Unexpected execution');
   if(c.workExpected&&(!result.plan?.work||!result.plan.work.stages.some(x=>x.module==='RX BIBI')||result.plan.work.executed!==false))throw Error('Missing BIBI work verification');
   results.push({id:c.id,ok:true,contextUsed:!!result.contextUsed,answerLength:result.answer.length});
  }catch(e){results.push({id:c.id,ok:false,error:e.message});}
 }
 const report={kind:'rx-bibi-queen-dialogue',mode:'SYNTHETIC_LOCAL_PLANNER',authenticatedProductionChat:'NOT_TESTED',checkedAt:new Date().toISOString(),checks:results,ok:results.every(x=>x.ok)};
 fs.mkdirSync('rx-bibi-reports',{recursive:true});
 fs.writeFileSync('rx-bibi-reports/rx-queen-dialogue.json',JSON.stringify(report,null,2)+'\n');
 console.log('RX BIBI QUEEN DIALOGUE',JSON.stringify(report));
 if(!report.ok)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
