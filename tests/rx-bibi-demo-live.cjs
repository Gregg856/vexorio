'use strict';
const assert=require('node:assert/strict');
const origin=process.env.RX_BIBI_DEMO_ORIGIN||'https://vexorio.grzegorzbub1985.workers.dev';
const questions=[
'Cześć BIBI! Mam na imię Marek. Zapamiętaj moje imię na czas tej rozmowy.',
'Jak mam na imię?',
'Mam trzy zadania: naprawić czat, sprawdzić pamięć i przetestować matematykę. Powtórz je.',
'Które z moich zadań jest drugie?',
'Oblicz 125 × 8 + 350.',
'Jeśli od poprzedniego wyniku odejmę 250, ile zostanie?',
'Wyjaśnij prostymi słowami, czym zajmują się RX Mrówki.',
'A czym różni się od nich RX Królowa?',
'Co powinnaś zrobić, gdy nie znasz odpowiedzi na pytanie?',
'Podsumuj naszą rozmowę: moje imię, trzy zadania i końcowy wynik obliczenia.'
];
async function main(){
 const page=await fetch(origin+'/rx-bibi-demo.html',{signal:AbortSignal.timeout(12000)});
 assert.equal(page.status,200,'DEMO page missing (HTTP '+page.status+'). Deploy latest main.');
 assert.match(await page.text(),/\/api\/rx\/client\/demo\/chat/,'Demo page lacks API integration');
 const history=[],results=[];
 for(let i=0;i<questions.length;i++){
  const message=questions[i];
  const response=await fetch(origin+'/api/rx/client/demo/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({message,history:history.slice(-10)}),signal:AbortSignal.timeout(12000)});
  assert.equal(response.status,200,'DEMO API HTTP '+response.status+' at turn '+(i+1));
  const data=await response.json();
  assert.equal(data.ok,true,'DEMO response failed at turn '+(i+1));
  assert.equal(data.adminToolsAvailable,false,'DEMO must not enable admin tools');
  assert.equal(data.modelInferenceUsed,false,'DEMO must use local planner');
  assert.ok(typeof data.answer==='string'&&data.answer.trim(),'Missing answer at turn '+(i+1));
  const answer=data.answer;
  let passed=true,reason='Odpowiedź otrzymana';
  if(i===1){passed=/marek/i.test(answer);reason='Pamięć imienia';}
  if(i===2){passed=/czat/i.test(answer)&&/pami[eę]/i.test(answer)&&/matematyk/i.test(answer);reason='Lista trzech zadań';}
  if(i===3){passed=/pami[eę]/i.test(answer);reason='Drugie zadanie';}
  if(i===4){passed=/1350|1[\s.]350/.test(answer);reason='Matematyka: 1350';}
  if(i===5){passed=/1100|1[\s.]100/.test(answer);reason='Matematyka z kontekstem: 1100';}
  if(i===9){passed=/marek/i.test(answer)&&/1100|1[\s.]100/.test(answer);reason='Podsumowanie kontekstu';}
  results.push({turn:i+1,passed,reason,question:message,answer:answer.slice(0,1500)});
  history.push(message,answer);
  console.log((passed?'PASS':'FAIL')+' '+(i+1)+'/10 '+reason);
 }
 const fs=require('node:fs');fs.writeFileSync('rx-bibi-demo-report.json',JSON.stringify({origin,createdAt:new Date().toISOString(),passed:results.filter(x=>x.passed).length,total:10,results},null,2)+'\n');
 const failed=results.filter(x=>!x.passed);console.log('RESULT: '+(10-failed.length)+'/10 passed; report: rx-bibi-demo-report.json');
 if(failed.length)process.exitCode=1;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
