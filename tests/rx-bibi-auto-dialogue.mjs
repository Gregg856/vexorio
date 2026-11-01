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
const prompts=['Cześć BIBI!','Jak się masz?','Mam pytanie','Opowiedz coś ciekawego.','Co potrafisz?','Ile to jest 12 plus 8?','Co to jest fotosynteza?','Wyjaśnij mi astronomię.','Lubię książki.','Co o mnie wiesz?'];
for(let i=0;i<5;i++)scenarios.push({name:'automatic-conversation-'+(i+1),turns:prompts.map(message=>[message,/.+/])});
// Regression cases for real customer-chat issues fixed in #421–#423.
scenarios.push({name:'natural-customer-introductions',turns:[
 ['Mam na imię Kasia.',/O czym masz ochotę porozmawiać/],
 ['Co o mnie wiesz?',/Kasia/],
 ['Przypomnij, o czym przed chwilą rozmawialiśmy.',/Mam na imię Kasia/],
 ['O czym przed chwilą rozmawialiśmy?',/Mam na imię Kasia/]
]});
scenarios.push({name:'same-turn-profile',turns:[
 ['Mam na imię Ola. Co o mnie wiesz?',/Masz na imię Ola/],
 ['Przeprowadziłam się z Krakowa do Warszawy. Co teraz o mnie wiesz?',/Warszawy/]
]});
scenarios.push({name:'polish-unicode-names',turns:[
 ['Mam na imię Jaś.',/Jaś/],
 ['Co o mnie wiesz?',/Jaś/],
 ['Przypomnij, jak mam na imię.',/Jaś/]
]});
const results=[];
for(const scenario of scenarios){
 const history=[];
 for(const [message,expected] of scenario.turns){
  const result=planRXChat(message,history);
  const pass=expected.test(result.answer)&&result.answer.trim().length>0&&result.executed===0;
  results.push({scenario:scenario.name,message,pass,answer:result.answer,modelInferenceUsed:result.modelInferenceUsed});
  history.push(message,result.answer);
  assert.ok(history.length<=20);
 }
}
const issues=results.flatMap((r,index)=>{
 const problems=[];
 if(!r.pass)problems.push('assertion-failed');
 if(/Nie rozumiem jeszcze|Nie mam jeszcze silnika|Czat RX odpowiada przez serwerowy planer/i.test(r.answer))problems.push('generic-fallback');
 if(r.message.includes('Ile to jest 12 plus 8?')&&!/\b20\b/.test(r.answer))problems.push('math-answer-missing');
 if(r.message.includes('Co o mnie wiesz?')&&r.scenario==='profile-and-relocation'&&!/Krakowie/.test(r.answer))problems.push('profile-memory-missing');
 return problems.map(type=>({case:index+1,scenario:r.scenario,type,message:r.message,answer:r.answer.slice(0,240)}));
});
const developerQueue=issues.map(issue=>({source:'rx-bibi-auto-dialogue',priority:issue.type==='assertion-failed'?'high':'normal',status:'needs-review',...issue}));
writeFileSync('rx-bibi-developer-queue.json',JSON.stringify({schema:1,kind:'rx-developer-review-queue',generatedAt:new Date().toISOString(),count:developerQueue.length,items:developerQueue},null,2)+'\n');
const generic=results.filter(r=>/Czat RX odpowiada przez serwerowy planer|Nie rozumiem jeszcze|Nie mam jeszcze silnika/i.test(r.answer));
// Separate repeated smoke prompts from unique test coverage: 50 repetitions are not 50 distinct skills.
const uniquePrompts=new Set(results.map(r=>r.message));
const uniqueScenarios=new Set(results.map(r=>r.scenario));
const failingPrompts=new Set(results.filter(r=>!r.pass).map(r=>r.message));
const report={qualityIssues:issues.length,issues,genericFallbacks:generic.length,kind:'rx-bibi-auto-dialogue',schema:1,generatedAt:new Date().toISOString(),cases:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,uniquePromptCount:uniquePrompts.size,uniqueScenarioCount:uniqueScenarios.size,failedUniquePromptCount:failingPrompts.size,repeatedTurnCount:results.length-uniquePrompts.size,trainingPerformed:false,productionChatVerified:false,results};
writeFileSync('rx-bibi-auto-dialogue.json',JSON.stringify(report,null,2)+'\n');
console.log('RX BIBI automatic conversations:',report.passed+'/'+report.cases);
if(report.failed)process.exitCode=1;
