// RX chat planner: pure, read-only module for the Cloudflare Worker.
// Intent identifiers match rx-command-bridge.cjs; no Node-only dependencies.
const RULES=Object.freeze([
 {intent:'inspect_tests',topic:'diagnostyka',module:'queen',role:'tests',words:['test','błąd','blad','awari','sprawdź','sprawdz']},
 {intent:'plan_cloud_checks',topic:'chmura',module:'cloud',role:'diagnostics',words:['chmur','cloud','komputer']},
 {intent:'classify_task',topic:'model AI',module:'ants',role:'memory',words:['model','trening','uczen','uczeń','ai']},
 {intent:'rank_candidates',topic:'porównanie',module:'brain',role:'code',words:['porówn','porown','wybierz']}
]);
export function planRXChat(message,history=[]){
 if(typeof message!=='string'||!message.trim()||message.length>1000)throw new TypeError('Invalid message');
 if(!Array.isArray(history)||history.length>6||history.some(x=>typeof x!=='string'||x.length>1000))throw new TypeError('Invalid history');
 const last=history.at(-1)||'';
 const followup=/^(a |i |oraz |a co |co z |dalej|sprawdź też|sprawdz tez)/i.test(message.trim());
 const contextual=followup&&last?last+' '+message:message;
 const q=contextual.toLocaleLowerCase('pl-PL');
 const found=RULES.filter(r=>r.words.some(word=>q.includes(word)));
 const topics=found.map(r=>r.topic);
 const tasks=found.map(r=>({module:r.module,role:r.role,action:r.intent,status:'proposed',requiresApproval:true}));
 const plan={kind:'rx-coordinated-chat-proposal',queen:{status:'awaiting_approval',requiresApproval:true},ants:tasks.filter(t=>t.module==='ants'),cloud:{executionConnected:false},executed:0};
 const answer=topics.length?'👑 Rozpoznane obszary: '+topics.join(', ')+'. Mogę przygotować plan testów. Żadna praca nie została uruchomiona.':'👑 Nie rozpoznaję jeszcze tego pytania. Zapytaj o testy, chmurę lub model AI.';
 return {ok:true,answer,topics,tasks,plan,contextUsed:Boolean(followup&&last),executed:0,modelInferenceUsed:false};
}
