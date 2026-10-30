import catalog from './rx-task-catalog.cjs';
import math from './rx-math-core.cjs';
// RX chat planner: pure, read-only module for the Cloudflare Worker.
// Intent identifiers match rx-command-bridge.cjs; no Node-only dependencies.
const RULES=catalog.RULES;

export function planRXChat(message,history=[],learning=null){
 if(typeof message!=='string'||!message.trim()||message.length>8000)throw new TypeError('Invalid message');
 if(!Array.isArray(history)||history.length>20||history.some(x=>typeof x!=='string'||x.length>8000))throw new TypeError('Invalid history');
 // RX NAUKA 1.0: read-only, bounded session preference extraction.
 const recentUserTurns=history.filter((_,index)=>index%2===0).slice(-10);
 const preferences=recentUserTurns.filter(value=>/^(prosze|proszę|chce|chcę|wole|wolę|zawsze|nie chce|nie chcę)\b/i.test(value.trim())).filter(value=>value.length>=12&&value.length<=300).slice(-3);
 const rxLearning={kind:'rx-session-learning',preferences,verifiedFacts:0,trainingPerformed:false};
 // Client follow-ups use the latest user turn, never the assistant's broad answer.
 const latestUserTurn=history.length>=2?history.at(-2):history.at(-1);
 const briefReference=/^(?:a (?:to|ten|tamten|one|oni|jak|dlaczego|co z tym)|co z tym|co z nimi|dalej|rozwin(?: to)?|jak to dziala|dlaczego)[?.! ]*$/i.test(message.trim());
 if(briefReference&&(!latestUserTurn||!latestUserTurn.trim())){
  return {ok:true,answer:'👑 Do czego nawiązujesz? Napisz proszę temat lub powtórz pytanie, żebym nie zgadywała.',topics:[],tasks:[],plan:{queen:{requiresApproval:true},work:null},learning:rxLearning,contextUsed:false,multiIntent:false,intents:[],executed:0,modelInferenceUsed:false};
 }
 const last=history.at(-1)||'';
 const previous=history.slice(-5).filter(x=>x.trim());
 const followup=/^(a |i |oraz |a co |co z |dalej|sprawdź też|sprawdz tez|a ten |a tamten |co z tym|co z nim|co z nimi|zrob drugi punkt|zrób drugi punkt)/i.test(message.trim());
 // Use the most recent meaningful topic for short follow-ups; avoid mixing unrelated old intents.
 const normalizeRX=text=>text.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l');
 // Prefer the user's latest topic-bearing question over the Queen's own reply.
 // Assistant answers often mention several modules and can contaminate "Dalej".
 const topicPattern=/(mrowk|wirnik|turbina|chmur|cloudflare|test|bled|blad|kolejk|pamiec|wiedz|neural|math|matematyk|neuron|model)/;
 const hasTopic=x=>topicPattern.test(normalizeRX(x))||RULES.some(r=>r.words.some(w=>normalizeRX(x).includes(normalizeRX(w))));
 const recentUserQuestions=history.map((turn,i)=>({turn,i})).filter(x=>x.i%2===0).slice(-5).map(x=>x.turn);
 // Never promote the assistant's own generic reply into a remembered user topic.
 const recentTopic=recentUserQuestions.slice().reverse().find(x=>hasTopic(x)&&!(/^(dalej|a co|i co)[.!? ]*$/i.test(x.trim())))||'';
 const correction=/^(nie o to (mi )?chodzilo|nie o to chodzi|zle mnie zrozumialas|źle mnie zrozumiałaś)[.!? ]*$/i.test(normalizeRX(message.trim()));
 const returnTopic=/^(wroc do poprzedniego tematu|wróć do poprzedniego tematu)[.!? ]*$/i.test(message.trim());
 const elaborate=/^(wyjasnij dokladniej|wyjaśnij dokładniej|rozwin temat|rozwiń temat)[.!? ]*$/i.test(message.trim());
 const userTurns=history.filter((_,i)=>i%2===0).filter(x=>x.trim());
 const currentUserTopic=userTurns.slice().reverse().find(x=>hasTopic(x)&&!(/^(dalej|a co|i co)[.!? ]*$/i.test(x.trim())))||recentTopic;
 const previousUserTopic=(()=>{const meaningful=userTurns.filter(x=>hasTopic(x)&&!(/^(dalej|a co|i co)[.!? ]*$/i.test(x.trim())));const current=meaningful.at(-1);return meaningful.slice(0,-1).reverse().find(x=>normalizeRX(x)!==normalizeRX(current))||null;})();
 const selectedTopic=returnTopic?(previousUserTopic||''):currentUserTopic;
 const contextual=(followup||correction||returnTopic||elaborate)&&last?selectedTopic+' '+message:message;
 const q=contextual.toLocaleLowerCase('pl-PL');
 const found=RULES.filter(r=>r.words.some(word=>q.includes(word)));
 const topics=found.map(r=>r.topic);
 const tasks=found.map(r=>({module:r.module,role:r.role,action:r.id,status:'proposed',requiresApproval:true}));
 const plan={kind:'rx-coordinated-chat-proposal',queen:{status:'awaiting_approval',requiresApproval:true},ants:tasks.filter(t=>t.module==='ants'),cloud:{executionConnected:false},executed:0};
 const plainRaw=message.trim().toLocaleLowerCase('pl-PL').normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]','g'),'').replace(/ł/g,'l');
 // Small explicit typo dictionary; avoid fuzzy execution or rewriting user content.
 const plain=plainRaw.replace(/\b(sorawdz|sprwadz|sprawdx)\b/g,'sprawdz')
  .replace(/\b(zrib|zrob|zrub)\b/g,'zrob')
  .replace(/\b(poprawke|poprawka)\b/g,'popraw')
  .replace(/\b(mrowkami|mrowkach|mrowki)\b/g,'mrowki');
 const greet=/^(czesc|hej|halo|witaj|dzien dobry|siema|bibi|krolowa|rx)[!.? ]*$/.test(plain);
 const thanks=/^(dzieki|dziekuje|super|dobrze|ok|gotowe)[!.? ]*$/.test(plain);
 const contextPlain=contextual.toLocaleLowerCase('pl-PL').normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]','g'),'').replace(/ł/g,'l');
 const followupContext=Boolean(followup&&last);
 const asksAnts=/(mrowk|ants)/.test(contextPlain);
 const asksTurbine=/(wirnik|wirnika|turbine|turbina|silnik)/.test(contextPlain);
 const asksBuilding=/(buduj|buduje|budow|rozwij|ulepsz|pracuj|dzialaj)/.test(plain);
 const asksStatus=/(status|co robisz|jak idzie|co teraz|co potrafisz)/.test(plain);
 const asksName=/(jak (masz na imie|sie nazywasz)|kim jestes)/.test(plain);
 const asksMemory=/(czy (pamietasz|zapamietujesz)|jak dziala pamiec)/.test(plain);
 const asksConversation=/(pogadajmy|porozmawiajmy|chce pogadac|mozemy pogadac)/.test(plain);
 const asksTests=/(jakie testy|ktore testy|wyniki testow|czy testy przeszly|testy zielone)/.test(plain);
 const asksError=/(blad|bledy|nie dziala|awaria|napraw)/.test(plain);
 const asksCheckChat=/(sprawdz).{0,35}(czat|chat)/.test(plain);
 const asksFixChat=/(zrob|popraw|napraw).{0,35}(czat|chat)/.test(plain);
 const asksCloud=/(chmura|\bcloud\b|cloudflare|serwer|wdrozenie|deploy)/.test(plain);
 const asksQueue=/(kolejk|zadania w kolejce|ile zadan)/.test(plain);
 const asksSafety=/(bezpieczenstwo|bezpieczne|uprawnienia|dostep)/.test(plain);
 const asksCosts=/(koszt|platn|darmow|limit)/.test(plain);
 const asksKnowledge=/(wiedza swiata|wikipedia|encyklopedia|zrodla)/.test(plain);
 const asksPrivacy=/(prywatn|moje dane|moimi danymi|moich danych|kto widzi)/.test(plain);
 const asksNext=/(co dalej|nastepny krok|od czego zaczac)/.test(plain);
 const asksProgress=/(co (juz|wczoraj|ostatnio) (zrobil|zrobilismy|robil)|na czym skonczyl|co mamy gotowe|co jest gotowe|co zostalo zrobione|nie powtarzaj|krecimy sie w kolko|krecic sie w kolko)/.test(plain);

 // Public conversational intents; never imply access to private RX tools.
 const everydayGreeting=/^(co u ciebie|jak sie masz|jak mija dzien|jak leci)[?!. ]*$/.test(plain);
 const everydayThanks=/^(dziekuje bardzo|wielkie dzieki|dzieki za pomoc)[?!. ]*$/.test(plain);
 const everydayQuestion=/^(czy mozesz mi pomoc|potrzebuje porady|mam pytanie)[?!. ]*$/.test(plain);
 const asksCapabilities=/(co umiesz|co potrafisz|jakie funkcje)/.test(plain);
 const asksHelp=/(pomoc|pomoz|jak rozmawiac|co moge napisac)/.test(plain);
 const multiParts=[
  {id:'ants',match:asksAnts,label:'🐜 Mrówki',detail:'Mogę przygotować plan ich pracy; faktyczny stan wymaga raportu.'},
  {id:'errors',match:asksError,label:'🔧 Błędy',detail:'Potrzebuję komunikatu lub raportu, aby wskazać przyczynę.'},
  {id:'tests',match:asksTests,label:'🧪 Testy',detail:'Wynik trzeba odczytać z RX Coordinator.'},
  {id:'queue',match:asksQueue,label:'📦 Kolejka',detail:'Jest zapisana lokalnie w przeglądarce.'},
  {id:'cloud',match:asksCloud,label:'☁️ Chmura',detail:'Stan wdrożenia wymaga sprawdzenia Cloudflare i GitHub.'},
  {id:'turbine',match:asksTurbine,label:'⚙️ Wirnik',detail:'Uruchamia wyłącznie zatwierdzone testy.'},
  {id:'knowledge',match:asksKnowledge,label:'📚 Wiedza',detail:'Źródła można odczytać z modułu wiedzy świata.'},
  {id:'next',match:asksNext,label:'👑 Kolejne kroki',detail:'Najpierw raport, potem wybór poprawki i zatwierdzenie.'}
 ];
 // Deterministic order for multiple requests: diagnose -> propose fix -> verify.
 // This is a read-only plan; no modules are executed by the chat planner.
 const compoundRequest=/(?:\b(?:i|oraz|potem|nastepnie)\b|,)/.test(plain);
 const orderedWork=[];
 if(compoundRequest){
  const wantsDiagnosis=asksCheckChat||/(sprawdz|testuj|przetestuj).{0,45}(czat|chat|panel)/.test(plain);
  const wantsRepair=asksFixChat||/(popraw|napraw|usun bledy|zrob popraw).{0,45}(czat|chat|panel)/.test(plain)||/(czat|chat|panel).{0,45}(popraw|napraw)/.test(plain);
  if(wantsDiagnosis||wantsRepair)orderedWork.push({module:'RX BIBI',action:'Sprawdź wskazany obszar i zgromadź wynik testu',status:'proposed',requiresApproval:true});
  if(wantsRepair)orderedWork.push({module:'RX Developer',action:'Przygotuj poprawkę na podstawie wyniku',status:'proposed',requiresApproval:true});
  if(wantsRepair)orderedWork.push({module:'RX BIBI',action:'Zweryfikuj poprawkę testem regresji',status:'proposed',requiresApproval:true});
 }
 if(orderedWork.length>1)plan.work={kind:'rx-ordered-work-proposal',status:'proposed',executed:false,requiresApproval:true,stages:orderedWork};
 const selectedParts=multiParts.filter(x=>x.match);
 const multiIntent=selectedParts.length>=2;
 const requestedPoint=plain.match(/^(?:zrob|pokaz|omow|wyjasnij|sprawdz|przejdz do|punkt)\s+(?:punkt\s+)?(pierwszy|drugi|trzeci|czwarty|piaty|[1-5])(?:\s+punkt)?[.!? ]*$/);
 const pointIndex=requestedPoint?({'pierwszy':0,'drugi':1,'trzeci':2,'czwarty':3,'piaty':4,'1':0,'2':1,'3':2,'4':3,'5':4}[requestedPoint[1]]):-1;
 const priorPlan=history.slice().reverse().find(x=>/\b1[.)]\s/.test(x)&&/\b2[.)]\s/.test(x));
 const planItems=priorPlan?[...priorPlan.matchAll(/(?:^|\n)\s*([1-5])[.)]\s*([^\n]+)/g)].map(x=>x[2].trim()):[];
 const selectedPoint=pointIndex>=0&&pointIndex<planItems.length?planItems[pointIndex]:null;
 // Explicit, bounded Float32 dot-product command. No eval, network or training.
 const dotRequest=message.trim().match(/^rx\s+dot\s*:\s*\[([^\]]*)\]\s*;\s*\[([^\]]*)\]\s*$/i);
 let dotResult=null;
 if(dotRequest){
  const parseVector=value=>{
   const parts=value.split(',').map(x=>x.trim());
   if(parts.length<1||parts.length>16||parts.some(x=>!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(x)))return null;
   const numbers=parts.map(Number);
   if(numbers.some(x=>!Number.isFinite(x)||Math.abs(x)>1000000))return null;
   return new Float32Array(numbers);
  };
  const a=parseVector(dotRequest[1]),b=parseVector(dotRequest[2]);
  dotResult=a&&b&&a.length===b.length?math.dot(a,b):null;
 }
 // Small matrices only (up to 4x4). RX MMUL uses the existing Float32 kernel.
 const matrixRequest=message.trim().match(/^RX\s+(MADD|MMUL)\s*:\s*(.+)$/is);
 let matrixResult=null;
 if(matrixRequest){
  const parseMatrix=raw=>{
   try{
    const value=JSON.parse(raw);
    if(!Array.isArray(value)||value.length<1||value.length>4||!Array.isArray(value[0])||value[0].length<1||value[0].length>4)return null;
    const cols=value[0].length;
    if(value.some(row=>!Array.isArray(row)||row.length!==cols||row.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>1000000)))return null;
    return {rows:value.length,cols,flat:new Float32Array(value.flat())};
   }catch{return null;}
  };
  const parts=matrixRequest[2].split(';');
  if(parts.length===2){
   const a=parseMatrix(parts[0].trim()),b=parseMatrix(parts[1].trim());
   if(a&&b){
    const multiply=matrixRequest[1].toUpperCase()==='MMUL';
    if((multiply&&a.cols===b.rows)||(!multiply&&a.rows===b.rows&&a.cols===b.cols)){
     const out=multiply?math.matmul(a.flat,b.flat,a.rows,a.cols,b.cols):Float32Array.from(a.flat,(v,i)=>v+b.flat[i]);
     if([...out].every(Number.isFinite)){
      const cols=multiply?b.cols:a.cols;
      matrixResult=Array.from({length:a.rows},(_,i)=>Array.from(out.slice(i*cols,(i+1)*cols)));
     }
    }
   }
  }
 }
 let answer;
 if(matrixRequest)answer=matrixResult?'🧮 RX Math Core — '+matrixRequest[1].toUpperCase()+' (Float32): '+JSON.stringify(matrixResult)+'. Obliczenie bez zewnętrznego AI.':'🧮 Nieprawidłowe macierze lub wymiary. Użyj: RX MADD: [[1,2],[3,4]]; [[5,6],[7,8]] albo RX MMUL: [[1,2]]; [[3],[4]] (maks. 4×4).';
 else if(dotRequest)answer=dotResult!==null&&Number.isFinite(dotResult)?'🧮 RX Math Core — iloczyn skalarny (Float32): '+dotResult+'. Obliczenie lokalne, bez zewnętrznego AI.':'🧮 Nieprawidłowe wektory. Użyj: RX DOT: [1,2]; [3,4] (po 1–16 liczb, jednakowa długość).';
 else if(requestedPoint&&selectedPoint)answer='👑 Punkt '+(pointIndex+1)+' z poprzedniego planu: '+selectedPoint+'\\n🔒 Mogę omówić ten krok, ale nie uruchamiam go bez zatwierdzenia.';
 else if(requestedPoint)answer='👑 Nie widzę w ostatnich wiadomościach numerowanego planu z tym punktem. Wklej plan albo napisz, który krok masz na myśli.';
 else if(multiIntent)answer='👑 Rozumiem kilka spraw w jednym poleceniu:\\n'+selectedParts.map((x,i)=>(i+1)+'. '+x.label+': '+x.detail).join('\\n')+'\\n🔒 To plan odpowiedzi, nie uruchomienie zadań.';
 else if(/^(?:napisz|uloz|stworz)\s+(?:mi\s+)?(?:krotkie\s+)?zyczenia\s+(?:urodzinowe\s+)?(?:dla\s+)?([\p{L} -]{2,55})[.!? ]*$/iu.test(plain)){
  const recipient=message.trim().replace(/^(?:napisz|ułóż|uloz|stwórz|stworz)\s+(?:mi\s+)?(?:krótkie|krotkie)?\s*życzenia\s+(?:urodzinowe\s+)?(?:dla\s+)?/iu,'').replace(/[.!? ]+$/u,'').trim();
  answer='🎂 '+(recipient?'Dla '+recipient+': ':'')+'Wszystkiego najlepszego! Dużo zdrowia, radości, spokoju i spełnienia marzeń. Niech każdy dzień przynosi coś dobrego!';
 }
 else if(/^(?:popraw|popraw tekst)\s*:\s*[^\n]+/iu.test(message.trim())){
  const source=message.trim().replace(/^(?:popraw|popraw tekst)\s*:\s*/iu,'').trim();
  const cleaned=source.replace(/\s+/g,' ').replace(/\s+([,.!?;:])/g,'$1');
  const fixed=cleaned.charAt(0).toLocaleUpperCase('pl-PL')+cleaned.slice(1)+(/[.!?]$/.test(cleaned)?'':'.');
  answer='✍️ Prosta korekta interpunkcji i odstępów (nie pełna korekta językowa): '+fixed;
 }
 else if(/^(?:ile to|oblicz)\s+[-+]?\d+(?:[.,]\d+)?\s*[+*\/\-]\s*[-+]?\d+(?:[.,]\d+)?\s*\??$/iu.test(plain)){
  const m=plain.match(/([-+]?\d+(?:[.,]\d+)?)\s*([+*\/\-])\s*([-+]?\d+(?:[.,]\d+)?)/);
  const a=Number(m[1].replace(',','.')),b=Number(m[3].replace(',','.'));
  const n=m[2]==='+'?a+b:m[2]==='-'?a-b:m[2]==='*'?a*b:b===0?NaN:a/b;
  answer=Number.isFinite(n)?'🧮 Wynik: '+n:'🧮 Nie mogę wykonać tego działania (np. dzielenie przez zero).';
 }
 else if(/^(?:przetlumacz|tlumacz)\s+(?:na\s+)?(?:angielski|niemiecki|polski)\s*:/iu.test(plain))answer='🌍 Nie mam jeszcze silnika tłumaczeń dowolnych zdań. Mogę pomóc z prostymi przykładami, ale nie będę wymyślać tłumaczenia.';
 else if(/^(?:zapamietaj|przypomnij)\s*:/i.test(plain))answer='🔒 W czacie klienta BIBI nie zapisuję ani nie odczytuję trwałych notatek Królowej RX. Możesz kontynuować rozmowę w tej sesji; funkcje pamięci administratora są dostępne wyłącznie w osobnym, uprawnionym panelu.';
 else if(/(?:czy mozesz|mozesz|zrob|wykonaj|uruchom|wyslij|pobierz).{0,85}(?:moje haslo|moj login|haslo|sekret|platnosc|przelew|wszystkich klientow|na produkcje|wdrozenie)/i.test(plain))answer='🔒 BIBI nie ma dostępu do haseł, płatności, wysyłki do klientów ani samodzielnych wdrożeń. Mogę jedynie wyjaśnić bezpieczne kolejne kroki. Nie wykonałam żadnej operacji.';
 else if(greet)answer='👑 Cześć! Jestem Królowa RX. Możemy rozmawiać o Mrówkach, Wirniku, chmurze i budowie VEXORIO. Napisz, co chcesz sprawdzić albo zaplanować.';
 else if(thanks)answer='👑 Jasne! Jestem gotowa na kolejne pytanie. Możemy omówić Mrówki, Wirnik lub testy RX.';
 else if(asksName)answer='👑 Jestem Królowa RX — rozmowna część VEXORIO. Mogę odpowiadać na pytania i pomagać planować testy, ale nie udaję niezależnego modelu AI.';
 else if(asksMemory)answer='🧠 Pamiętam ograniczony kontekst ostatnich wiadomości. W czacie klienta RX BIBI historia może być zachowana w bieżącej sesji przeglądarki, ale nie jest to trwała pamięć ani trening modelu. Polecenia „Zapamiętaj” i „Przypomnij” dotyczą osobnego, uprawnionego panelu RX.';
 else if(correction)answer='👑 Rozumiem, poprzednia odpowiedź nie trafiła w Twoje pytanie. W temacie „'+currentUserTopic.slice(0,140)+'” napisz proszę, co konkretnie mam zmienić lub wyjaśnić. Nie będę zgadywać Twojej intencji.';
 else if(returnTopic)answer=previousUserTopic?'👑 Wracamy do wcześniejszego tematu: „'+previousUserTopic.slice(0,140)+'”. Co chcesz w nim rozwinąć?':'👑 Nie widzę w ostatniej historii drugiego, wcześniejszego tematu. Napisz, do czego mam wrócić.';
 else if(elaborate)answer='👑 Rozwijamy temat: „'+currentUserTopic.slice(0,140)+'”. Mogę omówić działanie, ograniczenia albo zaproponować konkretny test. Który aspekt Cię interesuje?';
 else if(asksConversation)answer='👑 Jasne, porozmawiajmy! Co dziś najbardziej chcesz ulepszyć w VEXORIO albo co Cię ciekawi?';
 else if(asksTests)answer='🧪 Mogę wskazać testy i pomóc odczytać raport. Ich rzeczywisty wynik sprawdź przez „Sprawdź testy RX” lub raport RX Coordinator. Nie zgaduję, czy ostatni przebieg był zielony.';
 else if(orderedWork.length>1)answer='👑 Rozumiem kilka zadań. Proponowana kolejność:\\n'+orderedWork.map((x,i)=>(i+1)+'. '+x.module+': '+x.action).join('\\n')+'\\n🔒 To plan — nie uruchomiłam testów ani nie zmieniłam kodu.';
 else if(asksCheckChat)answer='🧪 Rozumiem: chcesz sprawdzić czat RX. Mogę zaproponować test wiadomości, kontekstu i obsługi błędów. Nie uruchomiłam testu ani nie znam jego wyniku bez raportu.';
 else if(asksFixChat)answer='🔧 Rozumiem: chcesz poprawić czat RX. Potrzebuję objawu lub wyniku testu, żeby przygotować konkretną poprawkę. Samo polecenie nie zmienia kodu.';
 else if(asksError)answer='🔧 Opisz błąd albo wklej dokładny komunikat. Pomogę ustalić możliwą przyczynę i zaproponować test. Bez raportu nie potwierdzę naprawy.';
 else if(asksQueue)answer='🐜 Czat klienta nie udostępnia kolejki Warsztatu administratora ani nie uruchamia kodu. Stan zadań można sprawdzić wyłącznie w uprawnionym panelu RX.';
 else if(asksSafety)answer='🔒 Wykonanie zatwierdzonych testów wymaga sesji administratora i osobnego potwierdzenia. Wklejony kod nie jest uruchamiany automatycznie.';
 else if(asksCosts)answer='💰 RX korzysta z własnego planera i dostępnych usług. Nie uruchamiam płatnego modelu bez konfiguracji. Limity GitHub i Cloudflare nadal obowiązują.';
 else if(asksKnowledge)answer='📚 W tym czacie nie mam podłączonego wyszukiwania w internecie z podaniem źródła. Nie oznacza to, że cała Wikipedia jest zapisana lokalnie.';
 else if(asksPrivacy)answer='🔐 Panel administratora RX jest oddzielony od czatu klienta. Historia czatu klienta może być przechowywana w pamięci bieżącej sesji przeglądarki; nie jest automatycznie zapisywana jako wiedza Królowej RX. Nie podawaj w czacie haseł ani sekretów.';
 else if(asksProgress)answer='👑 W naszym repozytorium mamy już czat RX ADMIN, endpoint /api/rx/chat, pamięć na polecenia Zapamiętaj / Przypomnij, RX Neural Core, Math Core i planowanie Mrówek. Nie budujmy ich ponownie. Aktualne commity, wyniki testów i punkt kontynuacji są zapisane w PROJECT_STATUS.md na GitHubie. Nie mam tu automatycznego odczytu tego pliku, więc nie będę zgadywać, co dokładnie zrobiono wczoraj. Następny cel: ulepszać odpowiedzi w istniejącym czacie RX ADMIN. Zmiany wymagają zatwierdzenia.';
 else if(/^rx pomoc$/i.test(message.trim()))answer='👑 Dostępne umiejętności: RX DOT, RX MMUL, RX MADD, planowanie zadań, analiza błędów, pamięć i testy RX. Napisz polecenie, aby rozpocząć.';
 else if(asksNext)answer='👑 Najpierw sprawdź raport ostatnich testów, potem wybierz jedną poprawkę i przygotuj zadanie w Warsztacie. Wykonanie wymaga zatwierdzenia.';
 else if(/(?:rx\s*)?(?:neural|math|matematy|sie[cć]|sieci neuronow|model neuronow)/i.test(contextPlain))answer='🧠 RX Neural Core i RX Math Core to nasze istniejące moduły eksperymentalne: mała sieć neuronowa i operacje na macierzach Float32. Ich kod jest w repozytorium, ale nie są podłączone do generowania odpowiedzi czatu i nie zastępują modelu językowego. Mogę zaplanować testy integracji bez uruchamiania treningu ani dodatkowych kosztów.';
 else if(/(?:pami[eę][cć]|zapami[eę]t|histori[aę] rozmow)/i.test(q))answer='🧠 RX ma istniejący moduł trwałych notatek oraz ograniczony kontekst rozmowy przesyłany przez panel. Trwały zapis lub odczyt wykonuję tylko na wyraźne polecenie „zapamiętaj:” albo „przypomnij:”. Nie zapisuję automatycznie treści rozmowy do pamięci treningowej.';
 else if(asksCapabilities)answer='👑 Mogę rozmawiać o RX, proponować zadania, objaśniać testy, odczytywać wiedzę i korzystać z pamięci na wyraźne polecenie. Nie pracuję samodzielnie w tle.';
 else if(asksCloud)answer='☁️ Cloudflare udostępnia panel RX, a GitHub Actions uruchamia zatwierdzone testy. Status wdrożenia i raporty trzeba sprawdzać osobno; sam czat nie potwierdza publikacji.';
 else if(asksTurbine)answer='⚙️ RX Wirnik służy do ograniczonego, równoległego wykonywania zatwierdzonych testów. Nie zwiększa fizycznej mocy komputera. Ostatni przebieg sprawdzisz w panelu Królowej przez „RX Wirnik — ostatni przebieg”. Samo pytanie nie uruchamia pracy.';
 else if(asksAnts)answer='🐜 Mrówki RX to moduły zadań i testów, nie niezależne istoty AI. Mogę zaplanować ich pracę, ale rzeczywiste wykonanie wymaga zatwierdzenia i uruchomienia wykonawcy. Stan kolejki sprawdzisz w kategorii Mrówki.';
 else if(asksBuilding)answer='👑 Rozwijamy RX etapami: mózg rozmowy, Mrówki i Wirnik. W tym czacie mogę przygotować plan, wyjaśnić stan systemu i wskazać testy. Nie mogę twierdzić, że samodzielnie buduję lub wykonuję zadania w tle.';
 else if(asksStatus)answer='👑 Czat RX odpowiada przez serwerowy planer. Aby poznać rzeczywisty stan pracy, wybierz „Odśwież raport RX Coordinator” albo „RX Wirnik — ostatni przebieg”. Nie mam tutaj transmisji pracy Mrówek na żywo.';
 else if(asksHelp)answer='👑 Napisz np. „Co robią Mrówki?”, „Jak działa Wirnik?”, „Jakie testy wykonać?” lub „Co budujemy dalej?”. Mogę prowadzić rozmowę i przygotowywać bezpieczne plany.';
 else if(topics.length)answer='👑 Rozumiem temat: '+[...new Set(topics)].join(', ')+'. Mogę pomóc przygotować plan testów i wyjaśnić kolejne kroki. Niczego nie uruchomiłam bez zatwierdzenia.';
 else if(/^(dlaczego|czemu|jak|co|kiedy|gdzie|kto|czy)\\b/.test(plain))answer='👑 To pytanie wykracza poza moje obecne reguły rozmowy. Nie chcę zgadywać odpowiedzi. Mogę pomóc je rozłożyć na części lub sprawdzić w module wiedzy, jeśli jest podłączony. Samo pytanie nie uruchamia wyszukiwania.';
 else if(/^(wymysl|opowiedz|napisz historie|stworz historie)\\b/.test(plain))answer='👑 Mogę pomóc zaplanować historię, ale mój lokalny planer nie tworzy jeszcze swobodnych opowieści. Podaj bohatera i miejsce, a przygotuję zarys; nie będę udawać pełnego modelu językowego.';
 else answer='👑 Nie rozumiem jeszcze tego pytania wystarczająco dobrze, żeby odpowiedzieć rzetelnie. Napisz proszę inaczej, czego potrzebujesz, albo podaj przykład. Nie będę zgadywać ani udawać, że wykonałam działanie.';

 // RX Queen work planner: natural-language work requests, with BIBI as verifier.
 // A plan is not execution; RX Developer must be connected to a real executor.
 const workIntent=/(zbuduj|stw[oó]rz|napisz|dodaj|ulepsz|rozbuduj|popraw|napraw|przygotuj|zaprojektuj)/i.test(message)
  &&/(rx|kr[oó]low|m[oó]zg|model|modu[lł]|panel|kod|mr[oó]wk|czat|bibi)/i.test(message);
 if(workIntent&&!plan.work&&!matrixRequest&&!dotRequest){
  const requested=message.trim().slice(0,500);
  plan.work={
   kind:'rx-queen-work-order',request:requested,status:'proposed',executed:false,
   verification:{module:'RX BIBI',required:true,status:'pending',passed:null},
   stages:[
    {module:'RX Queen',action:'Rozbij polecenie na małe, sprawdzalne kroki',status:'proposed'},
    {module:'RX Developer',action:'Przygotuj zmianę w istniejącym kodzie RX',status:'awaiting_executor'},
    {module:'RX BIBI',action:'Sprawdź zmianę testami i zgłoś wynik',status:'awaiting_executor'},
    {module:'RX Queen',action:'Pokaż wynik właścicielowi do zatwierdzenia',status:'awaiting_approval'}
   ],requiresApproval:true
  };
  answer='👑 Przyjęłam zadanie: '+requested+'\\n🐜 Plan: analiza → RX Developer przygotowuje kod → RX BIBI sprawdza → pokazuję wynik do zatwierdzenia.\\n🔒 To na razie plan pracy; nie uruchomiłam jeszcze wykonawcy ani nie zmieniłam plików.';
 }
 // RX Queen conversation repair: answer the actual question, not a generic test plan.
 const conversationalBuild=/(porozmawiaj|pogadaj|od czego zaczniemy|jak zaczac|jak zaczac budow)/i.test(plain)
  &&/(mozg|model|ai|rx|krolow)/i.test(plain);
 const badReply=/(zle odpowiada|odpowiadasz nie na temat|nie rozumiesz|ciagle to samo|w kolko to samo)/i.test(plain);
 if(conversationalBuild){
  answer='👑 Zacznijmy od tego, co już mamy: lokalnego planera RX, historii rozmów i modułów testowych. Pierwszy konkretny krok to lepsze rozumienie pytań i pamięć kontekstu. Następnie sprawdzimy jakość odpowiedzi na przykładowych rozmowach. To jeszcze nie jest samodzielnie wytrenowany model AI. Co chcesz rozwijać najpierw: rozmowę czy pamięć?';
  plan.work=null;
 }
 if(badReply){
  answer='👑 Widzę problem: mój lokalny planer korzysta z reguł i czasem powtarza ogólne odpowiedzi zamiast odpowiedzieć na pytanie. Wklej jedną moją błędną odpowiedź i napisz, jakiej oczekujesz. Porównamy obie wersje i poprawimy regułę. Nie uruchamiam testów bez Twojego polecenia.';
  plan.work=null;
 }
 // Explicit conversational questions override keywords appearing in prohibitions.
 const noTests=/(nie uruchamiaj|bez uruchamiania|bez testow|zadnych testow|nie rob testow|tylko rozmawiac)/i.test(plain);
 const asksAboutBrain=/(jak dziala|jak funkcjonuje|czego (jeszcze )?nie potrafisz|co (juz )?potrafisz)/i.test(plain)
  &&/(mozg|model|rx|krolow|twoj)/i.test(plain)
  && !/(jak dziala pamiec|jak funkcjonuje pamiec)/i.test(plain);
 if(asksAboutBrain){
  answer='👑 Mój obecny mózg RX to lokalny planer oparty na regułach. Rozpoznaję wybrane polecenia, korzystam z ostatnich wiadomości i potrafię proponować zadania. Mam też osobną pamięć na jawne polecenia zapisu. Nie umiem jeszcze swobodnie rozmawiać jak duży model językowy, samodzielnie trenować modelu ani naprawiać kodu bez podłączonego wykonawcy. RX NAUKA wykrywa niektóre preferencje w historii, ale jeszcze nie uczy modelu. Możemy zacząć od lepszego rozumienia pytań.';
  plan.work=null;
 }
 if(noTests){
  tasks.length=0;
  if(plan.work)plan.work=null;
  if(!asksAboutBrain&&/(diagnostyk|test|raport)/i.test(answer)){
   answer='👑 Rozumiem, chcesz rozmawiać bez uruchamiania testów i raportów. Powiedz, jaki temat mam wyjaśnić; nie będę proponować testów.';
  }
 }
 // RX NAUKA 2.0: short follow-ups use the last user question, not a repeated template.
 const userMessages=history.filter(x=>/^Użytkownik:\s*/i.test(x)).map(x=>x.replace(/^Użytkownik:\s*/i,'').trim());
 const latestUserMessage=userMessages.at(-1)||'';
 const brainContext=/(mozg|model|rx nauka|pamiec|krolow)/i.test(normalizeRX(latestUserMessage));
 const shortFollowup=/^(a (pamiec|nauka|rozmowa)|co dalej|dalej|rozwin|rozwin to|jak to dziala|a jak|dlaczego|od czego zaczac)[?!. ]*$/i.test(plain);
 if(shortFollowup&&brainContext){
  if(/pamiec|nauka/i.test(plain))answer='👑 Pamięć rozmowy to przechowywanie wcześniejszych wiadomości, a nauka to wykorzystanie zatwierdzonych poprawek w następnych odpowiedziach. Obecnie RX rozpoznaje wybrane preferencje, ale nie trenuje modelu. Następny krok: sprawdzanie, czy moja odpowiedź uwzględnia Twoją ostatnią poprawkę.';
  else answer='👑 Wróćmy do budowy mózgu RX. Mamy planer i ograniczoną historię rozmowy. Teraz rozwijamy rozumienie kolejnych pytań oraz uczenie z poprawek. Możemy zacząć od pamięci kontekstu albo od poprawiania nietrafionych odpowiedzi.';
  tasks.length=0;
  plan.work=null;
 }
 // RX NAUKA: full-sentence questions about learning are not memory commands.
 const learningQuestion=/(jak|w jaki sposob|czy|kiedy|co).{0,70}(nauk|ucz|uczyc|uczyla|uczyla sie|trenow)/i.test(plain)
  &&/(rozmow|wiadomosc|popraw|odpowiedz|twoj|twoja|rx|krolow)/i.test(plain);
 if(learningQuestion){
  answer='👑 Nauka z naszych rozmów będzie przebiegać etapami. Najpierw rozpoznaję temat i Twoje preferencje z ostatnich wiadomości. Kiedy poprawisz moją odpowiedź, przyszły moduł będzie mógł zapisać tę poprawkę jako przykład i użyć jej przy podobnym pytaniu. Obecnie RX NAUKA wykrywa wybrane preferencje i obsługuje niektóre pytania uzupełniające, ale nie zapisuje automatycznie trwałych lekcji ani nie trenuje wag modelu AI. Taką trwałą naukę musimy dopiero zbudować i przetestować.';
  tasks.length=0;
  plan.work=null;
 }
 // RX NAUKA: distinguish a question about learning from commands to save/recall notes.
 const asksLearningHow=/(jak|w jaki sposob|czy).{0,60}(nauk|ucz|uczen|uczyc)/i.test(plain)
  && /(rozmow|odpowiedzi|poprawek|bledow|twoj|twoja|rx)/i.test(plain);
 if(asksLearningHow){
  answer='👑 Chcę uczyć się z rozmów w trzech krokach: najpierw zapamiętać temat i Twoje preferencje w bieżącym czacie, potem rozpoznać, kiedy poprawiasz moją odpowiedź, a następnie wykorzystać tę poprawkę przy podobnym pytaniu. Obecnie działa tylko ograniczony kontekst i wykrywanie części preferencji; automatyczne utrwalanie poprawek i trenowanie modelu jeszcze nie działają. Nie zapisuję każdej wiadomości jako prawdy. Możemy rozwijać te funkcje po kolei.';
  tasks.length=0;
  plan.work=null;
 }
 // Evidence-aware suggestions only when trusted server-side learning is explicitly supplied.
 const verifiedLessons=learning&&learning.kind==='rx-queen-verified-learning'&&Array.isArray(learning.lessons)
  ?learning.lessons.filter(x=>x&&typeof x.observation==='string'&&typeof x.incidentId==='string').slice(0,3):[];
 // RX NAUKA 3.0: reuse only externally verified, bounded lessons for matching questions.
 // Never treat arbitrary chat history or generated teacher output as verified truth.
 const trustedReplies=learning&&learning.kind==='rx-queen-verified-learning'&&Array.isArray(learning.lessons)
  ?learning.lessons.filter(x=>x&&x.verified===true&&typeof x.question==='string'&&typeof x.correctAnswer==='string'
    &&x.question.length>=8&&x.question.length<=240&&x.correctAnswer.length>=8&&x.correctAnswer.length<=500).slice(0,20):[];
 const normalizedQuestion=normalizeRX(message.trim()).replace(/[^a-z0-9 ]/g,'').replace(/ +/g,' ').trim();
 const matchedLesson=trustedReplies.find(x=>normalizeRX(x.question).replace(/[^a-z0-9 ]/g,'').replace(/ +/g,' ').trim()===normalizedQuestion);
 if(matchedLesson&&!noTests&&!asksLearningHow){
  answer='👑 Sprawdzona lekcja RX: '+matchedLesson.correctAnswer;
  tasks.length=0;
  plan.work=null;
  rxLearning.verifiedFacts=1;
 }
 if(asksError&&verifiedLessons.length){
  const lesson=verifiedLessons[0];
  answer+='\\n🧠 RX BIBI wykrył wcześniej: '+lesson.observation.slice(0,180)+'. Obszar: '+String(lesson.panelArea||'RX').slice(0,90)+'. To wskazówka do diagnostyki, nie potwierdzona naprawa. Wymagana weryfikacja testem.';
 }
 if(everydayGreeting)answer='👑 Dziękuję, że pytasz! Jestem tutaj, żeby porozmawiać. Co u Ciebie słychać?';
 if(everydayThanks)answer='👑 Nie ma za co! Jeśli masz kolejne pytanie, śmiało napisz.';
 if(everydayQuestion)answer='👑 Jasne, napisz, w czym potrzebujesz pomocy. Jeśli nie będę znała odpowiedzi, powiem o tym wprost.';
 if(everydayGreeting||everydayThanks||everydayQuestion){tasks.length=0;plan.work=null;}
 return {ok:true,answer,topics,tasks,plan,learning:rxLearning,contextUsed:followupContext,multiIntent,intents:selectedParts.map(x=>x.id),executed:0,modelInferenceUsed:false};
}
