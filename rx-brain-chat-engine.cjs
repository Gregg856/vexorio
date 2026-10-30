'use strict';
const {planCommand}=require('./rx-command-bridge.cjs');
const {findSimilarTasks,suggestRelatedTasks}=require('./rx-bibi-task-store.cjs');
function chatRX(message,{history=[],tasks=[]}={}){
 if(typeof message!=='string'||!message.trim()||message.length>1000)throw Error('Invalid message');
 if(!Array.isArray(history)||history.length>6||history.some(x=>typeof x!=='string'||x.length>1000))throw Error('Invalid history');
 if(!Array.isArray(tasks)||tasks.length>50||tasks.some(t=>!t||typeof t!=='object'||typeof t.title!=='string'||!t.title.trim()||t.title.length>160||!['pending','completed'].includes(t.status)||Object.keys(t).some(k=>!['title','status'].includes(k))))throw Error('Invalid tasks');
 // Reuse the existing RX brain for bounded arithmetic; never evaluate arbitrary code.
 const mathMatch=/^(?:(?:ile to|oblicz|policz)\s+)?(-?\d{1,9}(?:[.,]\d{1,6})?)\s*([+*\/\-])\s*(-?\d{1,9}(?:[.,]\d{1,6})?)\s*\??$/i.exec(message.trim());
 if(mathMatch){
  const a=Number(mathMatch[1].replace(',','.')),b=Number(mathMatch[3].replace(',','.'));
  const op=mathMatch[2];
  if(op==='/'&&b===0)return {answer:'Nie można dzielić przez zero.',plan:{steps:[]},completedCount:0,contextUsed:false,executed:0};
  const result=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:a/b;
  if(Number.isFinite(result))return {answer:'Wynik: '+Number(result.toPrecision(12)).toString(),plan:{steps:[]},completedCount:0,contextUsed:false,executed:0};
 }
 const completed=tasks.filter(t=>t.status==='completed');
 const asksCompleted=/^(co (już|juz) (zrobione|ukończone)|pokaż (ukończone|zakończone) zadania|co (jest )?gotowe)[?!\\s]*$/i.test(message.trim());
 const isFollowup=text=>/^(dalej|sprawdź to|sprawdz to|a co z tym\\??|co dalej\\??)[.!?\\s]*$/i.test(text.trim());
 const previous=history.length?history[history.length-1]:'';
 const topic=[...history].reverse().find(item=>!isFollowup(item.trim())&&!/^(ok|gotowe|zielone|błąd|blad)[.!?\\s]*$/i.test(item.trim()))||'';

 const contextual=/^(a |i |oraz |a co |co z |dalej|sprawdź to|sprawdz to|co dalej|sprawdź też|sprawdz tez)/i.test(message.trim());
 const continuation=isFollowup(message);
 const request=contextual&&(continuation?topic:previous)?(continuation?topic:previous+' '+message):message;
 const plan=planCommand(request,{energyBalance:100});
 const phrase=request.toLocaleLowerCase('pl-PL').normalize('NFC').replace(/\\s+/g,' ').trim();
 let answer;
 const asksPending=/^(?:co (?:jeszcze )?(?:zostało|zostalo)(?: do zrobienia)?|pokaż (?:oczekujące|oczekujace|nieukończone|nieukonczone) zadania|jakie zadania (?:czekają|czekaja|są do zrobienia|sa do zrobienia))[?!.\\s]*$/i.test(message.trim());
 const pending=tasks.filter(t=>t.status==='pending');
 const asksEvidence=/^(czy (testy|test|naprawa) (są|sa|jest) (zielone|gotowa|gotowe)|jaki (jest )?wynik test(ów|ow|u)|czy to już naprawione|czy to juz naprawione)[?!\\s]*$/i.test(message.trim());
 const statusQuery=/^(?:jaki status zadania|sprawdź status zadania|sprawdz status zadania):?\s+(.+)$/i.exec(message.trim());
 const relatedQuery=/^(?:czy to zadanie już było|czy to zadanie juz bylo|sprawdź podobne zadanie|sprawdz podobne zadanie):?\s+(.+)$/i.exec(message.trim());
 if(statusQuery){
   const matches=findSimilarTasks(tasks,statusQuery[1].trim());
   if(matches.length===1){
     answer='Status zadania „'+matches[0].title+'” w przekazanym rejestrze: '+(matches[0].status==='completed'?'ukończone':'oczekujące')+'. Nie potwierdzam wykonania bez niezależnych testów.';
   }else if(matches.length>1){
     answer='Znalazłam kilka zadań o tej samej nazwie po normalizacji. Wybierz dokładny wpis; nie zgaduję statusu.';
   }else{
     answer='Nie znalazłam tego zadania w przekazanym rejestrze. Nie oznacza to, że nigdy go nie wykonywano.';
   }
 }else if(relatedQuery){
   const title=relatedQuery[1].trim();
   const exact=findSimilarTasks(tasks,title);
   const related=suggestRelatedTasks(tasks,title).filter(t=>!exact.some(e=>e.title===t.title));
   if(exact.length){
     answer='Znalazłam zadanie o tej samej nazwie (po normalizacji): '+exact.map(t=>t.title+' ['+t.status+']').join('; ')+'. Nie zmieniłam żadnego zadania.';
   }else if(related.length){
     answer='Możliwe powiązane zadania (wymagają ręcznej weryfikacji): '+related.slice(0,5).map(t=>t.title+' ['+t.status+']').join('; ')+'. Nie uznaję ich automatycznie za duplikaty i nie zmieniam statusów.';
   }else{
     answer='Nie znalazłam zadania o tej samej nazwie ani wystarczająco podobnego w przekazanym rejestrze. Nie jest to dowód, że praca nigdy nie była wykonywana.';
   }
 }else if(asksPending){
   answer=pending.length?'Zadania oczekujące w przekazanym rejestrze: '+pending.map(t=>t.title).join('; ')+'. To nie jest potwierdzenie bieżącego stanu GitHub.':'Brak zadań oczekujących w przekazanym rejestrze.';
 }else if(asksCompleted){
   answer=completed.length?'Zadania oznaczone jako ukończone w przekazanym rejestrze: '+completed.map(t=>t.title).join('; ')+'. Nie potwierdzam ich testów bez niezależnych danych.':'Brak zadań oznaczonych jako ukończone w przekazanym rejestrze.';
 }else if(asksEvidence){
   answer='Nie mam potwierdzonego wyniku GitHub Actions dla tej rozmowy. Samo słowo „zielone” nie jest dowodem. Podaj link do przebiegu lub sprawdź jego status.';
 }else if(continuation&&!topic){
   answer='Nie mam wcześniejszego kontekstu tej rozmowy. Napisz, który błąd lub test mam omówić.';
 }else if(continuation&&topic){
   answer='Kontynuuję temat: '+topic.slice(0,180)+'. Mogę zaproponować kroki diagnostyczne, ale nie potwierdzam wyniku testu bez danych z GitHub Actions.';
 }else
 if(/(?:^|\s)(usuń|usun|usuwać|usuwac|skasuj|kasuj|wyczyść|wyczysc|zresetuj|wymaż|wymaz)(?=\s|$)/.test(phrase)&&/produkcyj|produkcj|wszystkie dane|bazę danych|baze danych/.test(phrase)){
   answer='Nie wykonam usunięcia danych produkcyjnych bez wyraźnego potwierdzenia, autoryzacji i bezpiecznej kopii zapasowej.';
 }else if(/(24 godziny|24\/7|całą dobę|cala dobe|bez przerwy)/.test(phrase)&&/(rx|działa|dziala|pracuje|status)/.test(phrase)){
   answer='Nie mogę potwierdzić działania RX 24/7 bez bieżących danych uptime i monitoringu. Sprawdź rzeczywisty status usługi.';
 }else if(/(faktur|płatno|platno|rachunk|przelew|transakcj)/.test(phrase)){
   answer='Zgłoszenie dotyczące faktury lub płatności. Podaj szczegóły błędu i kroki odtworzenia; to odrębny problem, nie zakładam powiązania z czatem.';
 }else if(/(klawiatur|android|zasłania|zaslania|przykrywa|zakrywa|nachodzi)/.test(phrase)&&/(czat|chat|ekran|wiadomoś|wiadomos|pisani)/.test(phrase)){
   answer='Zgłoszenie błędu czatu na Androidzie: klawiatura może zasłaniać ekran. Podaj kroki odtworzenia i wersję urządzenia; naprawę trzeba potwierdzić testami.';
 }else if(/(sprawdzone napraw|potwierdzone napraw|naprawy czatu|pamięć napraw|pamiec napraw)/.test(phrase)){
   answer='Pokażę tylko zatwierdzone naprawy z potwierdzonym testem GitHub i commitem. Bez dostępu do zweryfikowanego rejestru nie potwierdzę konkretnej naprawy.';
 }else if(/^(cześć|czesc|hej|witaj|dzień dobry|dzien dobry)([ !?.]|$)/.test(phrase)){
   answer='Cześć! Jestem RX BIBI. Mogę pomóc opisać błąd, zaplanować testy i sprawdzić zadania.';
 }else{
   answer=plan.steps.length?'Rozpoznano zadania RX. Wymagają zatwierdzenia.':'Nie rozpoznano zadania. Zapytaj o testy, chmurę lub model AI.';
 }
 return {answer,plan,completedCount:completed.length,contextUsed:contextual&&(continuation?!!topic:!!previous),executed:0};
}
module.exports={chatRX};
