// RX #720: stateless read-only session arithmetic and user-provided list recall.
const normalize=s=>String(s).toLocaleLowerCase('pl-PL').normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l');
function facts(history){
 const users=history.filter((_,i)=>i%2===0);
 const listText=users.slice().reverse().map(x=>/mam trzy zadania\s*:\s*([^.!?]+)/iu.exec(x)?.[1]).find(Boolean);
 const list=listText?listText.split(/\s*,\s*|\s+i\s+/iu).map(x=>x.trim()).filter(Boolean):[];
 const name=users.slice().reverse().map(x=>/mam na imię\s+([\p{L}]{2,30})/iu.exec(x)?.[1]).find(Boolean);
 const answers=history.filter((_,i)=>i%2===1);
 const previous=answers.slice().reverse().map(x=>/wynik\s*:\s*(-?\d+(?:[.,]\d+)?)/iu.exec(x)?.[1]).find(Boolean);
 return {list,name,previous:previous===undefined?null:Number(previous.replace(',','.')),answers};
}
export function answerRXSession(message,history=[]){
 const input=normalize(message.trim()),{list:priorList,name,previous,answers}=facts(history);
 const currentList=/mam trzy zadania\s*:\s*([^.!?]+)/iu.exec(message)?.[1];
 const list=currentList?currentList.split(/\s*,\s*|\s+i\s+/iu).map(x=>x.trim()).filter(Boolean):priorList;
 const math=/^(?:oblicz|policz|ile to jest)\s+(-?\d{1,7})\s*([×*x+\-/])\s*(-?\d{1,7})\s*(?:([+\-×*x/])\s*(-?\d{1,7}))?[?.! ]*$/iu.exec(message.trim());
 if(math){
  const a=Number(math[1]),b=Number(math[3]),c=math[5]===undefined?null:Number(math[5]);
  const calc=(x,op,y)=>op==='+'?x+y:op==='-'?x-y:/[×*x]/i.test(op)?x*y:y===0?NaN:x/y;
  let result;
  if(c===null)result=calc(a,math[2],b);
  else if(/[×*x/]/i.test(math[4])&&/[+\-]/.test(math[2]))result=calc(a,math[2],calc(b,math[4],c));
  else result=calc(calc(a,math[2],b),math[4],c);
  if(Number.isFinite(result))return {answer:'🧮 Wynik: '+result,contextUsed:false};
 }
 const subtract=/odejme\s+(\d+)/.exec(input);
 if(input.includes('poprzedniego wyniku')&&subtract&&previous!==null)return {answer:'🧮 Wynik: '+(previous-Number(subtract[1])),contextUsed:true};
 if(list.length===3&&/powtorz je|wymien je|jakie to zadania/.test(input))return {answer:'👑 Twoje trzy zadania: 1) '+list[0]+'; 2) '+list[1]+'; 3) '+list[2]+'.',contextUsed:true};
 if(list.length===3&&/ktore.*zadani.*drugie|ktore.*zadani.*jest drugie|drugie zadanie/.test(input))return {answer:'👑 Drugie zadanie to: '+list[1]+'.',contextUsed:true};
 if(list.length===3&&input.includes('podsumuj nasza rozmowe')){
  const result=answers.slice().reverse().map(x=>/wynik\s*:\s*(-?\d+)/iu.exec(x)?.[1]).find(Boolean);
  return {answer:'👑 Imię: '+(name||'nie podano')+'. Trzy zadania: '+list.join('; ')+'. Końcowy wynik obliczenia: '+(result||'nie ustalono')+'.',contextUsed:true};
 }
 return null;
}
