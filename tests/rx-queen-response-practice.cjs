'use strict';
// Offline response-writing practice: approved examples only; not production chat.
const fs=require('node:fs'),path=require('node:path');
const PAIRS=Object.freeze([
 ['cześć królowo','Cześć! W czym mogę pomóc?','greeting'],
 ['dzień dobry','Dzień dobry! Jak mogę pomóc?','greeting'],
 ['co potrafisz','Mogę pomóc w rozmowie, porządkowaniu informacji i sprawdzaniu prostych zadań.','capability'],
 ['sprawdź testy','Mogę sprawdzić testy po otrzymaniu ich wyników. Nie potwierdzę sukcesu bez dowodu.','tests'],
 ['czy testy przeszły','Nie znam aktualnego wyniku bez odczytu raportu testów.','tests'],
 ['co pamiętasz','Mogę korzystać z zapisanej pamięci, jeżeli jest dostępna.','memory'],
 ['zapamiętaj to','Potrzebuję potwierdzenia zapisu, zanim powiem, że pamiętam.','memory'],
 ['ile to dwa plus trzy','Dwa plus trzy to pięć.','math'],
 ['ile to siedem razy osiem','Siedem razy osiem to pięćdziesiąt sześć.','math'],
 ['czy jesteś połączona z serwerem','Nie mogę potwierdzić połączenia bez sprawdzenia stanu serwera.','connectivity'],
 ['napraw błąd','Najpierw potrzebuję komunikatu błędu lub wyniku diagnostyki.','debug'],
 ['co zrobiliśmy','Mogę podsumować tylko działania potwierdzone w historii lub raportach.','history']
]);
const tokenize=s=>(s.toLocaleLowerCase('pl').match(/[\p{L}\p{N}]+/gu)||[]);
function answer(prompt){
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>500)throw Error('Invalid prompt');
 const q=new Set(tokenize(prompt));let best=null,score=0;
 for(const [input,response,intent] of PAIRS){
  const tokens=new Set(tokenize(input));
  const common=[...q].filter(t=>tokens.has(t)).length;
  const similarity=common/(q.size+tokens.size-common||1);
  if(similarity>score){score=similarity;best={response,intent};}
 }
 if(score<0.6)return {text:'Nie mam jeszcze wystarczających danych, żeby odpowiedzieć pewnie. Doprecyzuj pytanie.',matched:false,confidence:score,productionConnected:false};
 return {text:best.response,matched:true,intent:best.intent,confidence:score,productionConnected:false};
}
function evaluate(){
 const cases=PAIRS.map(([prompt,expected])=>({prompt,correct:answer(prompt).text===expected}));
 const passed=cases.filter(c=>c.correct).length;
 return {schema:1,kind:'rx-queen-response-practice',status:passed===cases.length?'PASS':'FAIL',correct:passed,total:cases.length,unseenTopic:answer('jak zbudować rakietę').matched===false,productionConnected:false};
}
if(require.main===module){
 const result=evaluate();const dir=path.join(__dirname,'..','rx-bibi-reports');
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'rx-queen-response-practice.json'),JSON.stringify(result,null,2)+'\n');
 console.log('RX QUEEN RESPONSE PRACTICE',JSON.stringify(result));
 if(result.status!=='PASS'||!result.unseenTopic)process.exitCode=1;
}
module.exports={PAIRS,answer,evaluate};
