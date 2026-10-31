'use strict';
const {planCommand}=require('./rx-command-bridge.cjs');
const {LANGUAGES,lookup}=require('./rx-language-seed.cjs');
const {findSimilarTasks,suggestRelatedTasks}=require('./rx-bibi-task-store.cjs');
function chatRX(message,{history=[],tasks=[],brainMemory=null}={}){
 if(typeof message!=='string'||!message.trim()||message.length>1000)throw Error('Invalid message');
 if(!Array.isArray(history)||history.length>6||history.some(x=>typeof x!=='string'||x.length>1000))throw Error('Invalid history');
 if(!Array.isArray(tasks)||tasks.length>50||tasks.some(t=>!t||typeof t!=='object'||typeof t.title!=='string'||!t.title.trim()||t.title.length>160||!['pending','completed'].includes(t.status)||Object.keys(t).some(k=>!['title','status'].includes(k))))throw Error('Invalid tasks');
 const translation=/^(?:translate|przetlumacz) (pl|de|en|uk) to (pl|de|en|uk): (.{1,160})$/i.exec(message.trim());
 if(translation){
  const entry=LANGUAGES.includes(translation[1])&&LANGUAGES.includes(translation[2])?lookup(translation[3],translation[1]):null;
  return {answer:entry?'Tlumaczenie ('+translation[2]+'): '+entry.translations[translation[2]]:'Nie znam tego zwrotu w sprawdzonym slowniku RX.',plan:{steps:[]},completedCount:0,contextUsed:false,executed:0};
 }
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
 const asksCompleted=/^(co (już|juz) (zrobione|ukończone)|pokaż (ukończone|zakończone) zadania|co (jest )?gotowe)[?!\s]*$/i.test(message.trim());
 const isFollowup=text=>/^(?:dalej|sprawdź to|sprawdz to|a co z tym\??|co dalej\??|kontynuuj|wróć do tego|wroc do tego)[.!?\s]*$/i.test(text.trim());
 const isAcknowledgement=text=>/^(?:ok|gotowe|zielone|błąd|blad|dzięki|dzieki|super)[.!?\s]*$/i.test(text.trim());
 const previous=history.length?history[history.length-1]:'';
 // History is alternating user/assistant turns; only user turns may anchor a new request.
 const meaningful=history.filter((item,index)=>index%2===0&&!isFollowup(item)&&!isAcknowledgement(item)).reverse();
 const topic=meaningful[0]||'';
 const wantsPreviousTopic=/^(?:wróć|wroc) do poprzedniego tematu[.!?\s]*$/i.test(message.trim());
 const olderTopic=meaningful.find(item=>item!==topic)||'';
 // Acknowledgements do not replace the actual topic when the user adds a short follow-up.
 const contextAnchor=topic;

 const contextual=/^(a |i |oraz |a co |co z |dalej|sprawdź to|sprawdz to|co dalej|sprawdź też|sprawdz tez)/i.test(message.trim());
 const continuation=isFollowup(message);
 const asksFix=/^(?:napraw to|popraw to)[.!?\s]*$/i.test(message.trim());
 const asksRecheck=/^(?:sprawdź jeszcze raz|sprawdz jeszcze raz|sprawdź ponownie|sprawdz ponownie)[.!?\s]*$/i.test(message.trim());
 const asksSuggestion=/^(?:co proponujesz|co byś zaproponował|co bys zaproponowal)[.!?\s]*$/i.test(message.trim());
 // A standalone continuation should use the last meaningful topic, not a short acknowledgement.
 const request=(contextual||continuation)&&(continuation?topic:contextAnchor)?(continuation?topic:contextAnchor+' '+message):message;
 const plan=planCommand(request,{energyBalance:100});
 const phrase=request.toLocaleLowerCase('pl-PL').normalize('NFC').replace(/\s+/g,' ').trim();
 let answer;
 const asksPending=/^(?:co (?:jeszcze )?(?:zostało|zostalo)(?: do zrobienia)?|pokaż (?:oczekujące|oczekujace|nieukończone|nieukonczone) zadania|jakie zadania (?:czekają|czekaja|są do zrobienia|sa do zrobienia))[?!.\s]*$/i.test(message.trim());
 const pending=tasks.filter(t=>t.status==='pending');
 const asksEvidence=/^(czy (testy|test|naprawa) (są|sa|jest) (zielone|gotowa|gotowe)|jaki (jest )?wynik test(ów|ow|u)|czy to już naprawione|czy to juz naprawione)[?!\s]*$/i.test(message.trim());
 const statusQuery=/^(?:jaki status zadania|sprawdź status zadania|sprawdz status zadania):?\s+(.+)$/i.exec(message.trim());
 const relatedQuery=/^(?:czy to zadanie już było|czy to zadanie juz bylo|sprawdź podobne zadanie|sprawdz podobne zadanie):?\s+(.+)$/i.exec(message.trim());
 const naturalTaskQuery=/^(?:co z zadaniem|jaki status zadania|czy zakończono zadanie)\s+[„"]?(.{3,160}?)[”"]?\??$/i.exec(message.trim());
 const taskFollowup=/^(?:a (?:to|tamto) zadanie|a jaki (?:ma )?status|czy (?:to|ono) (?:już )?(?:gotowe|zrobione))[?!.\s]*$/i.test(message.trim());
 const memoryQuery=/^(?:co pamiętasz o zadaniu|co pamietasz o zadaniu|jakie doświadczenie masz z zadaniem):?\s+([a-z0-9_-]{1,80})\??$/i.exec(message.trim());
 if(memoryQuery){
   const key=memoryQuery[1].toLowerCase();
   const record=brainMemory&&typeof brainMemory.recommend==='function'?brainMemory.recommend(key):null;
   answer=record&&record.known&&typeof record.action==='string'&&Number.isSafeInteger(record.samples)&&record.samples>0&&Number.isFinite(record.successRate)
    ?'RX Brain pamięta wskazówkę dla „'+key+'”: '+record.action.slice(0,120)+'. Próby: '+record.samples+', skuteczność w zapisanych próbach: '+Math.round(record.successRate*100)+'%. '+(record.confidence==='insufficient'?'Za mało prób na ocenę doświadczenia. ':record.confidence==='limited'?'Ograniczona liczba prób. ':record.confidence==='observed'?'Wynik oparty na większej liczbie zapisanych prób. ':'')+(record.warning==='more_failures_than_successes'?'Uwaga: więcej niepowodzeń niż sukcesów. ':'')+'To tylko rekomendacja, wymaga zatwierdzenia i nie jest dowodem aktualnego wyniku.'
    :'Nie mam zweryfikowanych doświadczeń RX Brain dla „'+key+'” w przekazanej pamięci. Nie zgaduję wyniku.';
 }else if(taskFollowup){
   const matches=topic?findSimilarTasks(tasks,topic):[];
   answer=matches.length===1?'W przekazanym rejestrze zadanie „'+matches[0].title+'” ma status: '+(matches[0].status==='completed'?'ukończone':'oczekujące')+'. Nie potwierdzam testów ani wdrożenia.': 'Nie mogę ustalić, którego zadania dotyczy pytanie. Podaj dokładną nazwę zadania z rejestru.';
 }else if(naturalTaskQuery){
   const name=naturalTaskQuery[1].replace(/[?!.]+$/,'').trim();
   const matches=findSimilarTasks(tasks,name);
   answer=matches.length===1?'W przekazanym rejestrze zadanie „'+matches[0].title+'” ma status: '+(matches[0].status==='completed'?'ukończone':'oczekujące')+'. To nie potwierdza wyniku testów ani wdrożenia.':matches.length>1?'Znalazłam kilka pasujących wpisów. Podaj dokładną nazwę zadania.':'Nie znalazłam dokładnego zadania „'+name.slice(0,160)+'” w przekazanym rejestrze. Nie zgaduję jego statusu.';
 }else if(statusQuery){
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
 }else if(asksFix||asksRecheck||asksSuggestion){
   if(!topic){
     answer='Nie mam kontekstu zadania. Napisz, czego dotyczy poprawka lub ponowny test.';
   }else if(asksFix){
     answer='W temacie: '+topic.slice(0,180)+'. Mogę przygotować propozycję poprawki, ale niczego nie zmieniłam ani nie uruchomiłam. Potrzebne są dane błędu i zatwierdzenie wykonania.';
   }else if(asksRecheck){
     answer='W temacie: '+topic.slice(0,180)+'. Ponowny test wymaga uruchomienia wykonawcy i sprawdzenia wyniku; nie mam tu dowodu wykonania testu.';
   }else{
     answer='W temacie: '+topic.slice(0,180)+'. Proponuję najpierw ustalić aktualny stan, potem wybrać najmniejszą poprawkę i potwierdzić ją testem.';
   }
 }else if(wantsPreviousTopic){
   answer=olderTopic?'Wracam do wcześniejszego tematu: '+olderTopic.slice(0,180)+'. Mogę zaproponować kolejne kroki, ale nie potwierdzam wykonania bez testów.':'Nie widzę wcześniejszego, odrębnego tematu w przekazanej historii rozmowy.';
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
   // Keep ordinary conversation useful without claiming untrained neural generation.
   const conversational=/^(?:jak się masz|jak sie masz|co u ciebie|możemy porozmawiać|mozemy porozmawiac|porozmawiaj ze mną|porozmawiaj ze mna)[?!.\s]*$/i.test(message.trim());
   const userGoal=/^(?:chcę|chce|potrzebuję|potrzebuje|zależy mi na|zalezy mi na)\s+(.{3,160})[.!?]?$/i.exec(message.trim());
   if(conversational)answer='Jestem tutaj i możemy rozmawiać. Nad czym chcesz dziś popracować albo o czym porozmawiać?';
   else if(userGoal)answer='Rozumiem, że zależy Ci na: '+userGoal[1].replace(/[.!?]+$/,'').slice(0,160)+'. Jaki pierwszy krok mam pomóc Ci zaplanować?';
   else if(/^(?:jak (?:mogę|moge|można|mozna)|w jaki sposób)\s+.{5,160}\??$/i.test(message.trim()))answer='Pytasz o sposób działania: '+message.trim().replace(/[?!.]+$/,'').slice(0,160)+'. Opisz, co już próbowałeś i jaki rezultat chcesz uzyskać, a dobierzemy następny krok. Nie uruchomiłam żadnej operacji.';
   else answer=plan.steps.length?'Rozpoznano zadania RX. Wymagają zatwierdzenia.':'Nie rozpoznano zadania. Zapytaj o testy, chmurę lub model AI.';
 }
 return {answer,plan,completedCount:completed.length,contextUsed:(asksFix||asksRecheck||asksSuggestion)?!!topic:(contextual||continuation)&&(continuation?!!topic:!!contextAnchor),executed:0};
}
// Optional sourced knowledge response. Existing deterministic chat remains unchanged.
async function chatRXWithKnowledge(message,options={}){
 const local=chatRX(message,options);
 if(!/^(?:co to jest|czym jest|kim jest|kto to|gdzie leży|gdzie jest|opowiedz o|powiedz mi o|znajdź informacje o|znajdz informacje o)\s+.{3,160}/i.test(message.trim()))return local;
 const lookup=options.knowledgeLookup||(await import('./rx-world-knowledge.mjs')).searchWorldKnowledge;
 try{
  const result=await lookup(message);
  if(!result||typeof result.summary!=='string'||!result.summary.trim()||typeof result.url!=='string'||!result.url.startsWith('https://pl.wikipedia.org/'))return local;
  return {...local,answer:result.summary.slice(0,700)+'\nŹródło: '+result.url,knowledgeSource:result.url};
 }catch{return local;}
}
// Explicit opt-in: read the existing persisted RX memory for advisory chat answers.
// Fail closed on corrupt or inaccessible snapshots; do not invent learning records.
async function chatRXWithStoredMemory(message,{memoryFile,...options}={}){
 if(typeof memoryFile!=='string'||!memoryFile.trim())throw Error('Invalid memory path');
 const {loadBrain}=require('./rx-brain-store.cjs');
 const brainMemory=await loadBrain(memoryFile);
 return chatRX(message,{...options,brainMemory});
}

// Explicit offline shadow classification in the EXISTING RX Brain.
// Does not alter answers, trigger commands, store messages or connect production.
// Cache the deterministic learner once per process; never retrain on each chat turn.
let shadowIntentLearner;
function chatRXWithIntentDiagnostics(message,options={}){
 const result=chatRX(message,options);
 if(!shadowIntentLearner){
  const {createLearner}=require('./rx-text-learner.cjs');
  shadowIntentLearner=createLearner({features:'bigram'});
 }
 const intent=shadowIntentLearner.classify(message);
 return {...result,intentDiagnostics:{
  label:intent.label,model:'rx-neural-bigram-shadow',
  advisoryOnly:true,changedAnswer:false,executed:0,
  productionConnected:false,trainedOnUserMessages:false
 }};
}

// Explicit local writing mode in the EXISTING RX Brain chat engine.
// No deployment switch or user-message training; default chatRX remains unchanged.
function chatRXWithWriting(message,options={}){
 const match=/^(?:napisz|ułóż|uloz|przygotuj)\s+(wiadomość|wiadomosc|odpowiedź|odpowiedz|streszczenie)\s*:\s*([\s\S]{1,500})$/iu.exec(message.trim());
 if(!match)return chatRX(message,options);
 const {compose}=require('./tests/rx-queen-writing-composer.cjs');
 const mode=/streszczenie/iu.test(match[1])?'summary':/odpowiedź|odpowiedz/iu.test(match[1])?'reply':'message';
 const result=compose({prompt:match[2],mode});
 return {answer:result.text,plan:{steps:[]},completedCount:0,contextUsed:false,executed:0,writingMode:mode,writingSource:result.source,productionConnected:false};
}

// Explicit opt-in reviewed-answer memory for the existing RX Brain.
// Only exact, previously approved prompts can override the local answer.
async function chatRXWithApprovedResponses(message,{approvedFile,...options}={}){
 if(typeof message!=='string'||!message.trim()||message.length>1000)throw Error('Invalid message');
 if(typeof approvedFile!=='string'||!approvedFile.trim())throw Error('Invalid approved memory path');
 const {load,lookup}=require('./rx-queen-approved-memory.cjs');
 const approved=await load(approvedFile);
 const match=lookup(approved,message);
 if(!match)return chatRX(message,options);
 const local=chatRX(message,options);
 return {...local,answer:match.answer,approvedResponse:true,reviewId:match.reviewId,executed:0};
}
module.exports={chatRX,chatRXWithKnowledge,chatRXWithStoredMemory,chatRXWithIntentDiagnostics,chatRXWithWriting,chatRXWithApprovedResponses};
