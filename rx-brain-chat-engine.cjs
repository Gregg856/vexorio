'use strict';
const {planCommand}=require('./rx-command-bridge.cjs');
function chatRX(message,{history=[]}={}){
 if(typeof message!=='string'||!message.trim()||message.length>1000)throw Error('Invalid message');
 if(!Array.isArray(history)||history.length>6||history.some(x=>typeof x!=='string'||x.length>1000))throw Error('Invalid history');
 const previous=history.length?history[history.length-1]:'';
 const contextual=/^(a |i |oraz |a co |co z |dalej|sprawdź też|sprawdz tez)/i.test(message.trim());
 const request=contextual&&previous?previous+' '+message:message;
 const plan=planCommand(request,{energyBalance:100});
 return {answer:plan.steps.length?'Rozpoznano zadania RX. Wymagają zatwierdzenia.':'Nie rozpoznano zadania. Zapytaj o testy, chmurę lub model AI.',plan,contextUsed:contextual&&!!previous,executed:0};
}
module.exports={chatRX};
