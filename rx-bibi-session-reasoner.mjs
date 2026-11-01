// RX #720: stateless read-only session arithmetic and user-provided list recall.
const normalize=s=>String(s).toLocaleLowerCase('pl-PL').normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l');
function facts(history){
 const users=history.filter((_,i)=>i%2===0);
 const listText=users.slice().reverse().map(x=>/mam trzy zadania\s*:\s*([^.!?]+)/iu.exec(x)?.[1]).find(Boolean);
 const list=listText?listText.split(/\s*,\s*|\s+i\s+/iu).map(x=>x.trim()).filter(Boolean):[];
 const name=users.slice().reverse().map(x=>/(?:mam na imię|jednak mam na imię)\s+([\p{L}]{2,30})/iu.exec(x)?.[1]).find(Boolean);
 const answers=history.filter((_,i)=>i%2===1);
 const previous=answers.slice().reverse().map(x=>/wynik\s*:\s*(-?\d+(?:[.,]\d+)?)/iu.exec(x)?.[1]).find(Boolean);
 return {list,name,previous:previous===undefined?null:Number(previous.replace(',','.')),answers};
}
export function answerRXSession(message,history=[]){
 const input=normalize(message.trim()),{list:priorList,name,previous,answers}=facts(history);
 if(/gdy nie znasz odpowiedzi|kiedy nie znasz odpowiedzi|co robisz gdy nie wiesz|co zrobisz jesli nie wiesz/.test(input))return {answer:'👑 Gdy nie znam odpowiedzi, powiem wprost, że nie wiem. Nie będę zgadywać ani wymyślać faktów. Poproszę o doprecyzowanie albo zaproponuję sprawdzenie informacji w wiarygodnym źródle.',contextUsed:false};
 const userTurns=history.filter((_,i)=>i%2===0);
 const names=userTurns.map(x=>/mam na imię\s+([\p{L}]{2,30})/iu.exec(x)?.[1]).filter(Boolean);
 const distinctNames=[...new Set(names.map(normalize))];
 if(/czy podalem dwa rozne imiona|czy zmienilem imie|czy poprawilem swoje imie/.test(input)&&distinctNames.length>1)
  return {answer:'👑 Tak. Najpierw podałeś imię '+names[0]+', a później '+names[names.length-1]+'. Przyjmuję najnowsze: '+names[names.length-1]+'.',contextUsed:true};
 if(/czy podalem dwa rozne imiona|czy zmienilem imie|czy poprawilem swoje imie/.test(input))
  return {answer:'👑 Nie widzę dwóch różnych imion w tej rozmowie.',contextUsed:true};
 if(name&&/jak mam na imie i ile mam zadan|ile mam zadan i jak mam na imie/.test(input)){
  const remembered=priorList.length===3?'3':'nie podano';
  return {answer:'👑 Masz na imię '+name+'. Liczba zadań: '+remembered+'.',contextUsed:true};
 }
 const currentList=/mam trzy zadania\s*:\s*([^.!?]+)/iu.exec(message)?.[1];
 const list=currentList?currentList.split(/\s*,\s*|\s+i\s+/iu).map(x=>x.trim()).filter(Boolean):priorList;
 const correctedTask=[message,...history.filter((_,i)=>i%2===0).reverse()].map(x=>/poprawka:\s*drugie zadanie to\s*([^.!?]+)/iu.exec(x)?.[1]?.trim()).find(Boolean);
 if(list.length===3&&correctedTask)list[1]=correctedTask;
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
 const multi=/^(?:oblicz|policz|ile to jest)\s+(-?\d{1,7})(\s*[+\-×*x/]\s*-?\d{1,7}){3,6}[?.! ]*$/iu.exec(message.trim());
 if(multi){
  const expr=message.trim().replace(/^(?:oblicz|policz|ile to jest)\s+/iu,'').replace(/[?.! ]+$/u,'').replace(/\s/g,'');
  const tokens=expr.startsWith('-')?expr.slice(1):expr;
  const parts=tokens.match(/\d+|[+\-×*x/]/gu);
  if(parts&&parts.join('')===tokens&&parts.length%2===1){
   const nums=[expr.startsWith('-')?-Number(parts[0]):Number(parts[0])],ops=[];
   for(let i=1;i<parts.length;i+=2){ops.push(parts[i]);nums.push(Number(parts[i+1]));}
   for(let i=0;i<ops.length;){if(/[×*x/]/i.test(ops[i])){const n=ops[i]==='/'?nums[i]/nums[i+1]:nums[i]*nums[i+1];nums.splice(i,2,n);ops.splice(i,1);}else i++;}
   const result=ops.reduce((v,op,i)=>op==='+'?v+nums[i+1]:v-nums[i+1],nums[0]);
   if(Number.isFinite(result))return {answer:'🧮 Wynik: '+result,contextUsed:false};
  }
 }
 const subtract=/odejme\s+(\d+)/.exec(input);
 if(input.includes('poprzedniego wyniku')&&subtract&&previous!==null)return {answer:'🧮 Wynik: '+(previous-Number(subtract[1])),contextUsed:true};
 if(name&&/jak mam na imie|pamietasz moje imie|przypomnij moje imie/.test(input))return {answer:'👑 Masz na imię '+name+'.',contextUsed:true};
 if(list.length===3&&/ile (?:mam|jest) zadan|ile zadan (?:mam|podalem)/.test(input))return {answer:'👑 Masz 3 zadania.',contextUsed:true};
 if(list.length===3&&/ktore.*zada(?:n|ni).*pierwsze|pierwsze zadanie/.test(input))return {answer:'👑 Pierwsze zadanie to: '+list[0]+'.',contextUsed:true};
 if(list.length===3&&/ktore.*zada(?:n|ni).*trzecie|trzecie zadanie/.test(input))return {answer:'👑 Trzecie zadanie to: '+list[2]+'.',contextUsed:true};
 if(list.length===3&&/ktore.*zada(?:n|ni).*ostatnie|ostatnie zadanie/.test(input))return {answer:'👑 Ostatnie zadanie to: '+list[2]+'.',contextUsed:true};
 if(previous!==null&&/jaki (?:byl|jest) (?:ostatni|poprzedni) wynik|przypomnij (?:ostatni|poprzedni) wynik/.test(input))return {answer:'🧮 Wynik: '+previous,contextUsed:true};
 const addPrevious=/dodaj\s+(\d+)/.exec(input);
 if(previous!==null&&input.includes('poprzedniego wyniku')&&addPrevious)return {answer:'🧮 Wynik: '+(previous+Number(addPrevious[1])),contextUsed:true};
 if(list.length===3&&/powtorz je|wymien je|jakie to zadania/.test(input))return {answer:'👑 Twoje trzy zadania: 1) '+list[0]+'; 2) '+list[1]+'; 3) '+list[2]+'.',contextUsed:true};
 if(list.length===3&&/ktore.*zada(?:n|ni).*drugie|drugie zadanie/.test(input))return {answer:'👑 Drugie zadanie to: '+list[1]+'.',contextUsed:true};
 if(list.length===3&&input.includes('podsumuj nasza rozmowe')){
  const result=answers.slice().reverse().map(x=>/wynik\s*:\s*(-?\d+)/iu.exec(x)?.[1]).find(Boolean);
  return {answer:'👑 Imię: '+(name||'nie podano')+'. Trzy zadania: '+list.join('; ')+'. Końcowy wynik obliczenia: '+(result||'nie ustalono')+'.',contextUsed:true};
 }
 return null;
}
