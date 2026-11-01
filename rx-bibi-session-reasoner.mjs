// RX #720: stateless read-only session arithmetic and user-provided list recall.
const normalize=s=>String(s).toLocaleLowerCase('pl-PL').normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l');
function facts(history){
 const users=history.filter((_,i)=>i%2===0);
 const listText=users.slice().reverse().map(x=>/mam trzy zadania\s*:\s*([^.!?]+)/iu.exec(x)?.[1]).find(Boolean);
 const list=listText?listText.split(/\s*,\s*|\s+i\s+/iu).map(x=>x.trim()).filter(Boolean):[];
 const name=users.slice().reverse().map(x=>/(?:mam na imię|jednak mam na imię|moje aktualne imię to|moje imię to)\s+([\p{L}]{2,30})/iu.exec(x)?.[1]).find(Boolean);
 const answers=history.filter((_,i)=>i%2===1);
 const previous=answers.slice().reverse().map(x=>/wynik\s*:\s*(-?\d+(?:[.,]\d+)?)/iu.exec(x)?.[1]).find(Boolean);
 return {list,name,previous:previous===undefined?null:Number(previous.replace(',','.')),answers};
}
export function answerRXSession(message,history=[]){
 const input=normalize(message.trim()),{list:priorList,name,previous,answers}=facts(history);
 if(/gdy nie znasz odpowiedzi|kiedy nie znasz odpowiedzi|co robisz gdy nie wiesz|co zrobisz jesli nie wiesz/.test(input))return {answer:'👑 Gdy nie znam odpowiedzi, powiem wprost, że nie wiem. Nie będę zgadywać ani wymyślać faktów. Poproszę o doprecyzowanie albo zaproponuję sprawdzenie informacji w wiarygodnym źródle.',contextUsed:false};
 if(/^(?:dlaczego tak odpowiedzialas|skad to wiesz|na jakiej podstawie)[?.! ]*$/u.test(input)){
  const lastUser=history.length>=2?normalize(history[history.length-2]):'';
  const lastAnswer=history.length?String(history[history.length-1]):'';
  if(!lastAnswer)return {answer:'👑 Nie mam wcześniejszej odpowiedzi do wyjaśnienia.',contextUsed:false};
  if(/wynik\s*:/iu.test(lastAnswer))return {answer:'🧮 Oparłam odpowiedź na obliczeniu wykonanym dla podanych liczb. Sprawdź działanie, jeśli chcesz potwierdzić wynik.',contextUsed:true};
  if(/imie|imienia|miast|mieszkam|zadani|zadan/.test(lastUser))
   return {answer:'👑 Oparłam odpowiedź na informacjach, które podałeś wcześniej w tej rozmowie. Nie weryfikowałam ich w zewnętrznym źródle.',contextUsed:true};
  return {answer:'👑 Nie mogę pewnie ustalić podstawy tej wcześniejszej odpowiedzi na podstawie dostępnego kontekstu.',contextUsed:true};
 }
 const question=input.replace(/^(?:prosze|powiedz mi|przypomnij mi|czy pamietasz)\s*,?\s*/,'');
 const userTurns=history.filter((_,i)=>i%2===0);
 const names=userTurns.map(x=>/(?:mam na imię|moje aktualne imię to|moje imię to)\s+([\p{L}]{2,30})/iu.exec(x)?.[1]).filter(Boolean);
 const distinctNames=[...new Set(names.map(normalize))];
 if(/czy podalem dwa rozne imiona|czy zmienilem imie|czy poprawilem swoje imie/.test(input)&&distinctNames.length>1)
  return {answer:'👑 Tak. Najpierw podałeś imię '+names[0]+', a później '+names[names.length-1]+'. Przyjmuję najnowsze: '+names[names.length-1]+'.',contextUsed:true};
 if(/czy podalem dwa rozne imiona|czy zmienilem imie|czy poprawilem swoje imie/.test(input))
  return {answer:'👑 Nie widzę dwóch różnych imion w tej rozmowie.',contextUsed:true};
 if(name&&/jak mam na imie i ile mam zadan|ile mam zadan i jak mam na imie|podaj moje imie i liczbe zadan/.test(question)){
  const remembered=priorList.length===3?'3':'nie podano';
  return {answer:'👑 Masz na imię '+name+'. Liczba zadań: '+remembered+'.',contextUsed:true};
 }
 const cities=userTurns.map(x=>/(?:mieszkam w|moje aktualne miasto to|chodziło mi o miasto)\s+([\p{L}-]{2,40})/iu.exec(x)?.[1]).filter(Boolean);
 const currentCity=cities[cities.length-1];
 const cityChanged=new Set(cities.map(normalize)).size>1;
 const interests=userTurns.map(x=>/(?:interesuję się|moje zainteresowanie to)\s+([^.!?]{2,80})/iu.exec(x)?.[1]?.trim()).filter(Boolean);
 const preferences=userTurns.map(x=>/(?:lubię|wolę)\s+([^.!?]{2,80})/iu.exec(x)?.[1]?.trim()).filter(Boolean);
 const interest=interests[interests.length-1],preference=preferences[preferences.length-1];
 if(/^(?:co o mnie pamietasz|podsumuj co o mnie wiesz|jakie informacje o mnie pamietasz)[?.! ]*$/.test(question)){
  const known=[name?'imię: '+name:null,currentCity?'miasto: '+currentCity:null,interest?'zainteresowanie: '+interest:null,preference?'preferencja: '+preference:null].filter(Boolean);
  return {answer:known.length?'👑 Z tej rozmowy pamiętam: '+known.join('; ')+'.':'👑 Nie mam jeszcze potwierdzonych informacji o Tobie w tej rozmowie.',contextUsed:known.length>0};
 }
 if(/^(?:czym sie interesuje|jakie mam zainteresowania)[?.! ]*$/.test(question)&&interest)
  return {answer:'👑 Podałeś zainteresowanie: '+interest+'.',contextUsed:true};
 if(/^(?:co lubie|jakie mam preferencje)[?.! ]*$/.test(question)&&preference)
  return {answer:'👑 Podałeś preferencję: '+preference+'.',contextUsed:true};

 if(name&&currentCity&&/jak mam na imie i gdzie mieszkam|gdzie mieszkam i jak mam na imie|podaj moje imie i miasto/.test(question))
  return {answer:'👑 Masz na imię '+name+' i według Twojej informacji mieszkasz w '+currentCity+'.',contextUsed:true};
 if(/gdzie mieszkam|w jakim miescie mieszkam|przypomnij moje miasto|jakie miasto podalem/.test(question)&&currentCity)
  return {answer:'👑 Według Twojej ostatniej informacji mieszkasz w '+currentCity+'.',contextUsed:true};
 if(/czy zmienilem miasto|czy podalem dwa rozne miasta/.test(input))
  return {answer:cityChanged?'👑 Tak. Najpierw podałeś '+cities[0]+', a później '+currentCity+'.':'👑 Nie widzę dwóch różnych miast w tej rozmowie.',contextUsed:true};
 const lastAsked=userTurns.length?normalize(userTurns[userTurns.length-1]):'';
 const previousTopic=/imie|imienia/.test(lastAsked)?'name':/miast|mieszkam/.test(lastAsked)?'city':/zainteresowan|interesuje/.test(lastAsked)?'interest':/preferencj|lubie/.test(lastAsked)?'preference':/zadani|zadan/.test(lastAsked)?'tasks':null;
 if(/^(?:a co z tym|przypomnij mi|przypomnij)[?.! ]*$/u.test(input)){
  const remembered=previousTopic==='name'&&name?'imię: '+name:previousTopic==='city'&&currentCity?'miasto: '+currentCity:previousTopic==='interest'&&interest?'zainteresowanie: '+interest:previousTopic==='preference'&&preference?'preferencja: '+preference:previousTopic==='tasks'&&priorList.length===3?'zadania: '+priorList.join('; '):null;
  return {answer:remembered?'👑 Przypominam z tej rozmowy — '+remembered+'.':'👑 Nie wiem, do której informacji się odnosisz. Doprecyzuj, co mam przypomnieć.',contextUsed:!!remembered};
 }
 if(/^(?:dlaczego|dlaczego tak)[?.! ]*$/u.test(input)){
  if(previousTopic&&history.length>=2)return {answer:'👑 Odniosłam się do informacji o '+({name:'imieniu',city:'mieście',interest:'zainteresowaniach',preference:'preferencjach',tasks:'zadaniach'}[previousTopic])+', którą podałeś wcześniej w tej rozmowie. Nie sprawdzałam jej poza rozmową.',contextUsed:true};
  return {answer:'👑 Nie potrafię ustalić, do której odpowiedzi odnosi się to pytanie. Doprecyzuj proszę.',contextUsed:false};
 }
 const shortFollowup=/^(?:a wczesniej|a teraz|co bylo wczesniej|co jest teraz)[?.! ]*$/u.test(question);
 if(shortFollowup&&userTurns.length){
  const lastQuestion=normalize(userTurns[userTurns.length-1]);
  const aboutCity=/miast|mieszkam|gdzie mieszkam/.test(lastQuestion);
  const aboutName=/imie|imienia/.test(lastQuestion);
  const older=/(wczesniej)/.test(question);
  if(aboutCity&&cities.length)return {answer:'👑 '+(older?'Wcześniej podałeś '+cities[0]:'Teraz podajesz '+currentCity)+'.',contextUsed:true};
  if(aboutName&&names.length)return {answer:'👑 '+(older?'Wcześniej podałeś imię '+names[0]:'Teraz podajesz imię '+names[names.length-1])+'.',contextUsed:true};
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
