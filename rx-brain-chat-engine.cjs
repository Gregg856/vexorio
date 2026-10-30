'use strict';
const {planCommand}=require('./rx-command-bridge.cjs');
function chatRX(message,{history=[]}={}){
 if(typeof message!=='string'||!message.trim()||message.length>1000)throw Error('Invalid message');
 if(!Array.isArray(history)||history.length>6||history.some(x=>typeof x!=='string'||x.length>1000))throw Error('Invalid history');
 const previous=history.length?history[history.length-1]:'';
 const contextual=/^(a |i |oraz |a co |co z |dalej|sprawdź też|sprawdz tez)/i.test(message.trim());
 const request=contextual&&previous?previous+' '+message:message;
 const plan=planCommand(request,{energyBalance:100});
 const phrase=request.toLocaleLowerCase('pl-PL');
 let answer;
 if(/(?:^|\\s)(usuń|usun|skasuj|wyczyść|wyczysc|zresetuj)(?=\\s|$)/.test(phrase)&&/produkcyj|produkcj|wszystkie dane|bazę danych|baze danych/.test(phrase)){
   answer='Nie wykonam usunięcia danych produkcyjnych bez wyraźnego potwierdzenia, autoryzacji i bezpiecznej kopii zapasowej.';
 }else if(/(24 godziny|24\/7|całą dobę|cala dobe|bez przerwy)/.test(phrase)&&/(rx|działa|dziala|pracuje|status)/.test(phrase)){
   answer='Nie mogę potwierdzić działania RX 24/7 bez bieżących danych uptime i monitoringu. Sprawdź rzeczywisty status usługi.';
 }else if(/(faktur|płatno|platno|rachunk)/.test(phrase)){
   answer='Zgłoszenie dotyczące faktury lub płatności. Podaj szczegóły błędu i kroki odtworzenia; to odrębny problem, nie zakładam powiązania z czatem.';
 }else if(/(klawiatur|android|zasłania|zaslania)/.test(phrase)&&/(czat|ekran|wiadomoś|wiadomos)/.test(phrase)){
   answer='Zgłoszenie błędu czatu na Androidzie: klawiatura może zasłaniać ekran. Podaj kroki odtworzenia i wersję urządzenia; naprawę trzeba potwierdzić testami.';
 }else if(/(sprawdzone napraw|potwierdzone napraw|naprawy czatu|pamięć napraw|pamiec napraw)/.test(phrase)){
   answer='Pokażę tylko zatwierdzone naprawy z potwierdzonym testem GitHub i commitem. Bez dostępu do zweryfikowanego rejestru nie potwierdzę konkretnej naprawy.';
 }else if(/^(cześć|czesc|hej|witaj|dzień dobry|dzien dobry)([ !?.]|$)/.test(phrase)){
   answer='Cześć! Jestem RX BIBI. Mogę pomóc opisać błąd, zaplanować testy i sprawdzić zadania.';
 }else{
   answer=plan.steps.length?'Rozpoznano zadania RX. Wymagają zatwierdzenia.':'Nie rozpoznano zadania. Zapytaj o testy, chmurę lub model AI.';
 }
 return {answer,plan,contextUsed:contextual&&!!previous,executed:0};
}
module.exports={chatRX};
