import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {planRXChat} from '../rx-chat-planner.mjs';

// Offline customer simulator: no account, network, admin execution or production writes.
const scenarios=[
 {name:'profile-and-relocation',turns:[
  ['Mam na imię Marek. Mieszkam w Krakowie. Interesuję się astronomią i lubię książki.',/Marek/],
  ['Co o mnie wiesz?',/Krakowie/],
  ['Przeprowadziłem się z Krakowa do Warszawy. BIBI, co teraz o mnie wiesz?',/Warszawy/]
 ]},
 {name:'no-fabricated-profile',turns:[['Co o mnie wiesz?',/Nie mam jeszcze/]]},
 {name:'basic-dialogue',turns:[['Jak się masz?',/./],['Mam pytanie',/./],['Ile to jest 12 plus 8?',/./]]}
];
const results=[];
for(const scenario of scenarios){
 const history=[];
 for(const [message,expected] of scenario.turns){
  const result=planRXChat(message,history);
  const pass=expected.test(result.answer)&&result.executed===0;
  results.push({scenario:scenario.name,message,pass,answer:result.answer,modelInferenceUsed:result.modelInferenceUsed});
  history.push(message,result.answer);
  assert.ok(history.length<=20);
 }
}
const report={kind:'rx-bibi-auto-dialogue',schema:1,generatedAt:new Date().toISOString(),cases:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,trainingPerformed:false,results};
writeFileSync('rx-bibi-auto-dialogue.json',JSON.stringify(report,null,2)+'\n');
console.log('RX BIBI automatic conversations:',report.passed+'/'+report.cases);
if(report.failed)process.exitCode=1;
