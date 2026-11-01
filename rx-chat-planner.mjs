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
 const preferences=[...new Set([...recentUserTurns,message].filter(value=>/^(?:prosze|proszę|chce|chcę|wole|wolę|zawsze|nie chce|nie chcę)(?=\s|[.,!?]|$)/iu.test(value.trim())).filter(value=>value.length>=12&&value.length<=300).map(value=>value.trim()))].slice(-3);
 const rxLearning={kind:'rx-session-learning',preferences,verifiedFacts:0,trainingPerformed:false};
 // RX BIBI: bounded, session-only name recall from user messages (never from assistant text).
 const sessionName=[...history.filter((_,i)=>i%2===0),message].slice().reverse().map(turn=>/\b(?:mam na imię|nazywam się)\s+([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{2,30})(?=\W|$)/i.exec(turn)).find(Boolean)?.[1]||null;
 // RX BIBI session learning: explicitly recall the latest user preference without treating it as model training.
 const asksPreferences=/^(?:jakie\s+preferencje\s+(?:pamiętasz|pamietasz)|(?:co|jakie)\s+(?:zapamiętałaś|zapamietalas)\s+(?:o\s+moich\s+)?preferencjach|jakie\s+mam\s+preferencje)[?.! ]*$/iu.test(message.trim());
 if(asksPreferences){
  const answer=preferences.length?'👑 W tej rozmowie zapamiętałam Twoje wskazówki: '+preferences.map(p=>'„'+p.slice(0,180)+'”').join('; ')+'.':'👑 Nie widzę jeszcze zapisanych wskazówek dotyczących stylu rozmowy w tej sesji.';
  return {ok:true,answer,topics:[],tasks:[],plan:{queen:{requiresApproval:true},work:null},learning:rxLearning,contextUsed:Boolean(history.length),multiIntent:false,intents:[],executed:0,modelInferenceUsed:false};
 }
 const asksAboutSelf=/\b(?:co|czego)\s+(?:teraz\s+)?(?:o mnie|o mojej osobie)\s+(?:wiesz|pamiętasz|pamietasz)\b|\bco\s+(?:wiesz|pamiętasz|pamietasz)\s+o\s+mnie\b/i.test(message);
 if(asksAboutSelf){
  const facts=[];
  if(sessionName)facts.push('Masz na imię '+sessionName+'.');
  // Session facts remain local to the current chat; never infer unknown details.
  const recentUserMessages=[...history.filter((_,i)=>i%2===0),message].slice(-10);
  const cityMessages=recentUserMessages.map(turn=>/(?:mieszkam w|przeprowadziłem się (?:z [^.!?,]{2,40} )?do|przeprowadziłam się (?:z [^.!?,]{2,40} )?do) ([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż-]{2,40})/i.exec(turn)?.[1]).filter(Boolean);
  if(cityMessages.length)facts.push('Ostatnio podane miasto: '+cityMessages.at(-1)+'.');
  const interests=recentUserMessages.map(turn=>/interesuję się ([^.!?,]{2,50}?)(?=\s+i\s+lubię\b|[.!?,]|$)/i.exec(turn)?.[1]?.trim()).filter(Boolean);
  if(interests.length)facts.push('Interesujesz się '+interests.at(-1)+'.');
  const likes=recentUserMessages.map(turn=>/lubię ([^.!?,]{2,50})/i.exec(turn)?.[1]?.trim()).filter(Boolean);
  if(likes.length)facts.push('Powiedziałeś, że lubisz '+likes.at(-1)+'.');
  const answer=facts.length?'👑 Z tej rozmowy wiem tylko tyle: '+facts.join(' ')+' Nie dopowiadam niczego, czego mi nie powiedziałeś.':'👑 Nie mam jeszcze potwierdzonych informacji o Tobie z tej rozmowy. Możesz mi coś o sobie opowiedzieć.';
  return {ok:true,answer,topics:[],tasks:[],plan:{queen:{requiresApproval:true},work:null},learning:rxLearning,contextUsed:Boolean(history.length),multiIntent:false,intents:[],executed:0,modelInferenceUsed:false};
 }
 const asksUserNameRecall=/\b(?:pamiętasz|pamietasz|przypomnij|jak)\b[\s\S]{0,90}\b(?:mam na imię|mam na imie|moje imię|moje imie)(?=\W|$)/i.test(message);
 const asksPrevious=/\b(?:o czym|co)\b[\s\S]{0,90}\b(?:przed chwilą|przed chwila|wcześniej|wczesniej)(?=\W|$)|\b(?:przypomnij|powiedz)\b[\s\S]{0,90}\bo czym\b/i.test(message);
 const introductoryName=/\b(?:mam na imię|nazywam się)\s+([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{2,30})(?=\W|$)/i.exec(message)?.[1]||null;
 if(asksUserNameRecall||asksPrevious||introductoryName){
  const priorUser=history.filter((_,i)=>i%2===0).slice().reverse().find(turn=>turn.trim()&&!/(?:\bco\s+(?:teraz\s+)?o\s+mnie\s+wiesz\b|\b(?:pamiętasz|pamietasz|przypomnij|o czym (?:przed chwilą|wcześniej)|co (?:przed chwilą|wcześniej))\b)/i.test(turn))||'';
  let answer;
  if(asksUserNameRecall||asksPrevious){
   const namePart=asksUserNameRecall?(sessionName?'Masz na imię '+sessionName+'.':'Nie podałeś mi jeszcze imienia w tej rozmowie.') : '';
   const topicPart=asksPrevious?(priorUser?'Wcześniej napisałeś: „'+priorUser.slice(0,180)+'”.':'Nie widzę wcześniejszej wiadomości w historii tego czatu.') : '';
   answer='👑 '+[namePart,topicPart].filter(Boolean).join(' ');
  }else answer='👑 Miło Cię poznać, '+introductoryName+'! '+(/(?:jak się (?:dzisiaj )?czujesz|co u ciebie|jak leci)/i.test(message)?'Dzięki, że pytasz. U mnie wszystko w porządku — jestem gotowa do rozmowy. A co u Ciebie?':'O czym masz ochotę porozmawiać?');
  return {ok:true,answer,topics:[],tasks:[],plan:{queen:{requiresApproval:true},work:null},learning:rxLearning,contextUsed:Boolean(history.length),multiIntent:false,intents:[],executed:0,modelInferenceUsed:false};
 }
 // Client follow-ups use the latest user turn, never the assistant's broad answer.
 const latestUserTurn=history.length>=2?history.at(-2):history.at(-1);
 const briefReference=/^(?:a (?:to|ten|tamten|one|oni|jak|dlaczego|co z tym)|co z tym|co z nimi|dalej|rob|rób|zrob|zrób|popraw|sprawdz|sprawdź|gotowe|zielone|rozwin(?: to)?|rozwiń(?: to)?|jak to dziala|dlaczego)[?.! ]*$/i.test(message.trim());
 if(briefReference&&(!latestUserTurn||!latestUserTurn.trim())){
  return {ok:true,answer:'👑 Do czego nawiązujesz? Napisz proszę temat lub powtórz pytanie, żebym nie zgadywała.',topics:[],tasks:[],plan:{queen:{requiresApproval:true},work:null},learning:rxLearning,contextUsed:false,multiIntent:false,intents:[],executed:0,modelInferenceUsed:false};
 }
 // RX BIBI 7.0: terse status/command messages without an explicit user task must not invent completed work.
 const shortCommand=/^(?:rob|rób|zrob|zrób|popraw|sprawdz|sprawdź|gotowe|zielone)[?.! ]*$/i.test(message.trim());
 if(shortCommand){
  const topicTurns=history.filter((_,i)=>i%2===0).filter(turn=>turn.trim()&&!/^(?:dalej|rob|rób|zrob|zrób|popraw|sprawdz|sprawdź|gotowe|zielone|ok|tak|nie)[?.! ]*$/i.test(turn.trim()));
  const lastTopic=topicTurns.at(-1)||'';
  const action=/^(?:popraw)[?.! ]*$/i.test(message.trim())?'poprawić':/^(?:sprawdz|sprawdź)[?.! ]*$/i.test(message.trim())?'sprawdzić':'kontynuować';
  const answer=lastTopic?'👑 Rozumiem, chcesz '+action+' temat: „'+lastTopic.slice(0,180)+'”. Mogę przygotować następny krok, ale nie wykonałam automatycznie żadnej zmiany ani testu.':'👑 Podaj konkretne zadanie lub temat. Nie będę zgadywać ani twierdzić, że coś wykonałam.';
  return {ok:true,answer,topics:[],tasks:[],plan:{queen:{requiresApproval:true},work:null},learning:rxLearning,contextUsed:Boolean(lastTopic),multiIntent:false,intents:[],executed:0,modelInferenceUsed:false};
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
 const correction=/^(nie o to (mi )?chodzilo|nie o to chodzi|zle mnie zrozumialas|chodzi(?:lo)? mi o (?:inny|cos innego) temat|mialem na mysli cos innego)[.!? ]*$/i.test(normalizeRX(message.trim()));
 const returnTopic=/^(wroc do poprzedniego tematu|wróć do poprzedniego tematu)[.!? ]*$/i.test(message.trim());
 const elaborate=/^(wyjasnij dokladniej|wyjaśnij dokładniej|rozwin temat|rozwiń temat)[.!? ]*$/i.test(message.trim());
 const userTurns=history.filter((_,i)=>i%2===0).filter(x=>x.trim());
 const currentUserTopic=userTurns.slice().reverse().find(x=>hasTopic(x)&&!(/^(dalej|a co|i co)[.!? ]*$/i.test(x.trim())))||recentTopic;
 const previousUserTopic=(()=>{const meaningful=userTurns.filter(x=>hasTopic(x)&&!(/^(dalej|a co|i co)[.!? ]*$/i.test(x.trim())));const current=meaningful.at(-1);return meaningful.slice(0,-1).reverse().find(x=>normalizeRX(x)!==normalizeRX(current))||null;})();
 // Resolve references only against explicit earlier user topics, never assistant guesses.
 const explicitTopicNames=[['mrówki',/(mrowk|ants)/],['wirnik',/(wirnik|turbina)/],['chmura',/(chmur|cloudflare)/],['testy',/(test|wynik)/],['pamięć',/(pamiec)/],['model',/(model|neural)/]];
 const topicLabel=turn=>{const normalized=normalizeRX(turn);return explicitTopicNames.find(([,pattern])=>pattern.test(normalized))?.[0]||null;};
 const previousLabel=topicLabel(previousUserTopic||'');
 const selectedTopic=returnTopic?(previousUserTopic||''):currentUserTopic;
 // A short continuation uses only an explicit recent user topic, never a guessed assistant topic.
 // Explicit topic switches prevent carrying an old intent into a new conversation.
 const topicSwitch=/^(?:zmienmy temat|zmiana tematu|nowy temat)[.!? ]*$/i;
 const latestSwitch=userTurns.map(turn=>topicSwitch.test(normalizeRX(turn.trim()))).lastIndexOf(true);
 const latestTopicIndex=userTurns.map(turn=>hasTopic(turn)&&!(/^(dalej|a co|i co)[.!? ]*$/i.test(turn.trim()))).lastIndexOf(true);
 const activeTopic=latestTopicIndex>latestSwitch?userTurns[latestTopicIndex]:'';
 // A topic switch is a hard boundary for short continuations, including explicit returns.
 const boundedSelectedTopic=returnTopic&&latestSwitch>=0&&latestTopicIndex<=latestSwitch?'':selectedTopic;
 const contextual=(followup||correction||returnTopic||elaborate)&&last?(returnTopic?boundedSelectedTopic:activeTopic)+' '+message:message;
 const q=contextual.toLocaleLowerCase('pl-PL');
 const normalizedQuery=normalizeRX(contextual);
 // Catalog words include Polish stems (e.g. 'awari', 'mrowk'); preserve prefix matching.
 const found=RULES.filter(r=>r.words.some(word=>normalizedQuery.includes(normalizeRX(word))));
 const topics=found.map(r=>r.topic);
 const tasks=found.map(r=>({module:r.module,role:r.role,action:r.id,status:'proposed',requiresApproval:true}));
 const plan={kind:'rx-coordinated-chat-proposal',queen:{status:'awaiting_approval',requiresApproval:true},ants:tasks.filter(t=>t.module==='ants'),cloud:{executionConnected:false},executed:0};
 const plainRaw=message.trim().toLocaleLowerCase('pl-PL').normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]','g'),'').replace(/ł/g,'l');
 // Small explicit typo dictionary; avoid fuzzy execution or rewriting user content.
 const plain=plainRaw.replace(/\b(sorawdz|sprwadz|sprawdx)\b/g,'sprawdz')
  .replace(/\b(zrib|zrob|zrub)\b/g,'zrob')
  .replace(/\b(poprawke|poprawka)\b/g,'popraw')
  .replace(/\b(mrowkami|mrowkach|mrowki)\b/g,'mrowki')
  // RX BIBI 4.5: narrowly scoped colloquial forms and frequent price typos.
  // Only change exact words; never rewrite amounts, percentages or user history.
  .replace(/\b(rabatm|rabtem|rabate[mn])\b/g,'rabatem')
  .replace(/\b(zaplacce|zaplce|zaplacee)\b/g,'zaplace')
  .replace(/\b(produktow|produktoww)\b/g,'produktow')
  .replace(/\b(sztukii|sztukiie)\b/g,'sztuki')
  .replace(/\b(podwyzkee|podwyzceee)\b/g,'podwyzce')
  .replace(/\b(ile wyjdzie za)\b/g,'ile zaplace za');
 const greet=/^(?:(?:czesc|hej|halo|witaj|dzien dobry|siema)(?:\s+(?:moja\s+)?(?:krolowo|krolowa|bibi|rx))?|(?:bibi|krolowa|krolowo|rx))[!.? ]*$/.test(plain);
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
 // RX BIBI 5.8: short acknowledgements without inventing an implied action.
 const shortReply=/^(tak|nie|wlasnie o to chodzi|dokladnie|zgadza sie)[?!. ]*$/.test(plain);
 const lastAssistantQuestion=history.length>=2&&history.length%2===0&&/[?]\s*$/.test(String(history.at(-1)||'').trim());
 let shortReplyAnswer=null;
 if(shortReply){
  if(/^(wlasnie o to chodzi|dokladnie|zgadza sie)/.test(plain)){
   shortReplyAnswer='👑 Rozumiem, dobrze uchwyciłam temat. Napisz, co chcesz wiedzieć dalej.';
  }else if(lastAssistantQuestion){
   shortReplyAnswer=/^tak/.test(plain)?
    '👑 Dobrze. Napisz, jaki szczegół mam wyjaśnić, a odpowiem konkretnie.':
    '👑 Rozumiem. Możemy zmienić temat albo zakończyć ten wątek.';
  }else{
   shortReplyAnswer='👑 Do czego odnosi się Twoje „'+(/^(tak)/.test(plain)?'tak':'nie')+'”? Doprecyzuj proszę, żebym nie zgadywała.';
  }
 }

 // RX BIBI 3.0: bounded natural-language arithmetic without eval or external AI.
 const arithmeticInput=plain.match(/^(?:ile to jest|oblicz|policz)\s+(-?\d{1,8}(?:[.,]\d{1,4})?)\s*(plus|minus|razy|podzielic przez|\+|\-|\*|\/|x)\s*(-?\d{1,8}(?:[.,]\d{1,4})?)[?!. ]*$/);
 let arithmeticAnswer=null;
 if(arithmeticInput){
  const left=Number(arithmeticInput[1].replace(',','.'));
  const right=Number(arithmeticInput[3].replace(',','.'));
  const op=arithmeticInput[2];
  const value=(op==='plus'||op==='+')?left+right:(op==='minus'||op==='-')?left-right:(op==='razy'||op==='*'||op==='x')?left*right:right===0?null:left/right;
  arithmeticAnswer=value===null?'🧮 Nie można dzielić przez zero.':Number.isFinite(value)?'🧮 Wynik: '+String(Number(value.toPrecision(12))):'🧮 Nie mogę obliczyć tego działania.';
 }
 // RX BIBI 3.6: bounded percentage calculations, no eval or remote calls.
 const percentInput=plain.match(/^(?:ile to jest|oblicz|policz)\s+(\d{1,8}(?:[.,]\d{1,4})?)\s*%\s*(?:z|od)\s+(\d{1,8}(?:[.,]\d{1,4})?)[?!. ]*$/);
 if(percentInput){
  const percentage=Number(percentInput[1].replace(',','.'));
  const base=Number(percentInput[2].replace(',','.'));
  const value=base*percentage/100;
  arithmeticAnswer=Number.isFinite(value)?'🧮 Wynik: '+String(Number(value.toPrecision(12))):'🧮 Nie mogę obliczyć tego procentu.';
 }
 // RX BIBI 3.7: simple discount and price-increase calculations (bounded inputs).
 const priceChange=plain.match(/^(?:oblicz|policz|ile (?:wynosi|to jest))\s+(?:cene?\s+po\s+)?(rabat(?:cie)?|obnizce|podwyzce)\s+(\d{1,3}(?:[.,]\d{1,2})?)\s*%\s+(?:z|od|dla|na)\s+(\d{1,8}(?:[.,]\d{1,2})?)(?:\s*(?:zl|eur|euro))?[?!. ]*$/);
 if(priceChange){
  const rate=Number(priceChange[2].replace(',','.'));
  const amount=Number(priceChange[3].replace(',','.'));
  const discount=priceChange[1]!=='podwyzce';
  arithmeticAnswer=rate>100&&discount?'🧮 Rabat nie może przekraczać 100%.':
   '🧮 Cena po '+(discount?'rabacie':'podwyżce')+': '+String(Number((amount*(1+(discount?-1:1)*rate/100)).toPrecision(12)));
 }
 // RX BIBI 3.8: natural price question, with bounded numeric inputs.
 const naturalPrice=plain.match(/^(?:produkt|towar|rzecz)\s+kosztuje\s+(\d{1,8}(?:[.,]\d{1,2})?)\s*(?:zl|eur|euro)?[,]?\s*ile\s+(?:zaplac[eę]|wyniesie\s+cena)\s+po\s+(rabacie|podwyzce)\s+(\d{1,3}(?:[.,]\d{1,2})?)\s*%[?!. ]*$/);
 if(naturalPrice){
  const amount=Number(naturalPrice[1].replace(',','.'));
  const rate=Number(naturalPrice[3].replace(',','.'));
  const discount=naturalPrice[2]==='rabacie';
  arithmeticAnswer=discount&&rate>100?'🧮 Rabat nie może przekraczać 100%.':
   '🧮 Cena po '+(discount?'rabacie':'podwyżce')+': '+String(Number((amount*(1+(discount?-1:1)*rate/100)).toPrecision(12)));
 }
 // RX BIBI 3.9: additional natural price phrasings, still read-only.
 const alternativePrice=plain.match(/^(?:(?:ile\s+(?:zaplac[eę]|bedzie\s+kosztowac)\s+(?:za\s+)?)?(?:produkt|towar|rzecz)\s+(?:za|kosztujacy)\s+(\d{1,8}(?:[.,]\d{1,2})?)\s*(?:zl|eur|euro)?\s+po\s+(rabacie|podwyzce)\s+(\d{1,3}(?:[.,]\d{1,2})?)\s*%|(?:jaka\s+(?:bedzie|jest)\s+cena|ile\s+(?:zaplac[eę]|wyniesie))\s+po\s+(rabacie|podwyzce)\s+(\d{1,3}(?:[.,]\d{1,2})?)\s*%\s+(?:od|z|dla)\s+(\d{1,8}(?:[.,]\d{1,2})?)\s*(?:zl|eur|euro)?)[?!. ]*$/);
 if(alternativePrice){
  const amount=Number((alternativePrice[1]||alternativePrice[6]).replace(',','.'));
  const rate=Number((alternativePrice[3]||alternativePrice[5]).replace(',','.'));
  const discount=(alternativePrice[2]||alternativePrice[4])==='rabacie';
  arithmeticAnswer=discount&&rate>100?'🧮 Rabat nie może przekraczać 100%.':
   '🧮 Cena po '+(discount?'rabacie':'podwyżce')+': '+String(Number((amount*(1+(discount?-1:1)*rate/100)).toPrecision(12)));
 }
 // RX BIBI 4.0: one-turn contextual price recalculation; only from a user price question.
 const rateFollowup=plain.match(/^(?:a\s+)?(?:przy|po\s+(?:rabacie|podwyzce))\s+(\d{1,3}(?:[.,]\d{1,2})?)\s*%[?!. ]*$/);
 if(rateFollowup){
  // Search only recent USER turns, never assistant text; stop at a new unrelated price.
  const recentPriceTurns=recentUserQuestions.slice().reverse();
  const topicSwitch=/^(?:zmienmy temat|zmiana tematu|nowy temat|przejdzmy do innego tematu|teraz inny temat)\b/;
  // An explicit topic switch ends the price context; ordinary thanks do not.
  const boundary=recentPriceTurns.findIndex(turn=>topicSwitch.test(normalizeRX(turn).trim()));
  const relevantTurns=boundary<0?recentPriceTurns:recentPriceTurns.slice(0,boundary);
  const previous=relevantTurns.find(turn=>{
   const t=normalizeRX(turn);
   return /(?:produkt|towar|rzecz)\s+(?:kosztuje|za)\s+\d/.test(t)
    ||/(?:rabacie|podwyzce)\s+\d{1,3}(?:[.,]\d{1,2})?\s*%\s+(?:od|z|dla)\s+\d/.test(t);
  })||'';
  const normalizedPrevious=normalizeRX(previous);
  const previousPrice=normalizedPrevious.match(/(?:produkt|towar|rzecz)\s+(?:kosztuje|za)\s+(\d{1,8}(?:[.,]\d{1,2})?)/)
    ||normalizedPrevious.match(/(?:rabacie|podwyzce)\s+\d{1,3}(?:[.,]\d{1,2})?\s*%\s+(?:od|z|dla)\s+(\d{1,8}(?:[.,]\d{1,2})?)/);
  const previousType=normalizedPrevious.match(/(?:po\s+|cena\s+po\s+)(rabacie|podwyzce)\s+\d{1,3}(?:[.,]\d{1,2})?\s*%/);
  if(previousPrice&&previousType){
   const amount=Number(previousPrice[1].replace(',','.'));
   const rate=Number(rateFollowup[1].replace(',','.'));
   const discount=previousType[1]==='rabacie';
   arithmeticAnswer=discount&&rate>100?'🧮 Rabat nie może przekraczać 100%.':
    '🧮 Cena po '+(discount?'rabacie':'podwyżce')+' '+rate+'% od '+amount+': '+String(Number((amount*(1+(discount?-1:1)*rate/100)).toPrecision(12)));
  }
 }
 // RX BIBI 4.3: quantity follow-up based on a prior unit price, not a discounted total.
 const quantityFollowup=plain.match(/^(?:a\s+)?(?:ile\s+(?:za|kosztuja?|zaplace\s+za)\s+)?(dwa|dwie|trzy|cztery|piec|szesc|siedem|osiem|dziewiec|dziesiec|\d{1,2})\s+(?:takie|takich)\s+(?:produkty|produktow|rzeczy|towary|sztuki)?[?!. ]*$/);
 if(quantityFollowup){
  const wordNumbers={dwa:2,dwie:2,trzy:3,cztery:4,piec:5,szesc:6,siedem:7,osiem:8,dziewiec:9,dziesiec:10};
  const count=wordNumbers[quantityFollowup[1]]??Number(quantityFollowup[1]);
  const turns=recentUserQuestions.slice().reverse();
  const boundary=turns.findIndex(turn=>/^(?:zmienmy temat|zmiana tematu|nowy temat|przejdzmy do innego tematu|teraz inny temat)\b/.test(normalizeRX(turn).trim()));
  const relevant=boundary<0?turns:turns.slice(0,boundary);
  const source=relevant.find(turn=>/(?:produkt|towar|rzecz)\s+(?:kosztuje|za)\s+\d/.test(normalizeRX(turn)));
  const price=source&&normalizeRX(source).match(/(?:produkt|towar|rzecz)\s+(?:kosztuje|za)\s+(\d{1,8}(?:[.,]\d{1,2})?)/);
  if(price&&count>=1&&count<=20){
   const unit=Number(price[1].replace(',','.'));
   arithmeticAnswer='🧮 '+count+' szt. po '+unit+' = '+String(Number((unit*count).toPrecision(12)));
  }
 }
 // RX BIBI 4.4: combined quantity and discount from the latest user unit price.
 const quantityDiscount=plain.match(/^(?:a\s+)?ile\s+zaplace\s+za\s+(dwa|dwie|trzy|cztery|piec|szesc|siedem|osiem|dziewiec|dziesiec|\d{1,2})\s+(?:sztuki|sztuk|takie\s+produkty|takich\s+produktow)\s+z\s+rabatem\s+(\d{1,3}(?:[.,]\d{1,2})?)\s*%[?!. ]*$/);
 if(quantityDiscount){
  const words={dwa:2,dwie:2,trzy:3,cztery:4,piec:5,szesc:6,siedem:7,osiem:8,dziewiec:9,dziesiec:10};
  const count=words[quantityDiscount[1]]??Number(quantityDiscount[1]);
  const rate=Number(quantityDiscount[2].replace(',','.'));
  const turns=recentUserQuestions.slice().reverse();
  const boundary=turns.findIndex(turn=>/^(?:zmienmy temat|zmiana tematu|nowy temat|przejdzmy do innego tematu|teraz inny temat)\b/.test(normalizeRX(turn).trim()));
  const relevant=boundary<0?turns:turns.slice(0,boundary);
  const source=relevant.find(turn=>/(?:produkt|towar|rzecz)\s+(?:kosztuje|za)\s+\d/.test(normalizeRX(turn)));
  const price=source&&normalizeRX(source).match(/(?:produkt|towar|rzecz)\s+(?:kosztuje|za)\s+(\d{1,8}(?:[.,]\d{1,2})?)/);
  if(rate>100)arithmeticAnswer='🧮 Rabat nie może przekraczać 100%.';
  else if(price&&count>=1&&count<=20){
   const unit=Number(price[1].replace(',','.'));
   arithmeticAnswer='🧮 '+count+' szt. po '+unit+' z rabatem '+rate+'% = '+String(Number((unit*count*(1-rate/100)).toPrecision(12)));
  }
 }
 // RX BIBI 4.6: everyday questions with honest, bounded advice.
 const everydayExplain=/^(co to jest|wyjasnij)\s+(haslo|link|spam|phishing|haslo jednorazowe|kopia zapasowa)[?!. ]*$/.test(plain);
 const everydayHelp=/^(jak (?:zrobic|ustawic)|pomoz mi (?:zrobic|ustawic))\s+(bezpieczne haslo|kopie zapasowa)[?!. ]*$/.test(plain);
 let everydayGuide=null;
 if(everydayExplain){
  const subject=plain.match(/^(?:co to jest|wyjasnij)\s+(.+?)[?!. ]*$/)?.[1];
  const explanations={
   haslo:'Hasło to sekret chroniący dostęp do konta. Nie podawaj go innym.',
   link:'Link to adres prowadzący do strony lub zasobu. Przed kliknięciem sprawdź adres.',
   spam:'Spam to niechciane wiadomości, często wysyłane masowo.',
   phishing:'Phishing to próba wyłudzenia danych przez podszywanie się pod zaufaną osobę lub firmę.',
   'haslo jednorazowe':'Hasło jednorazowe to kod ważny zwykle przez krótki czas. Nie przekazuj go innym.',
   'kopia zapasowa':'Kopia zapasowa to dodatkowa kopia danych, która pomaga je odzyskać po utracie.'
  };
  everydayGuide='👑 '+explanations[subject];
 }
 if(everydayHelp){
  everydayGuide=/haslo/.test(plain)?
   '👑 Użyj długiego, unikalnego hasła do każdego konta. Pomocny jest menedżer haseł i weryfikacja dwuetapowa.':
   '👑 Zapisz kopię ważnych plików na osobnym nośniku lub w zaufanej chmurze. Sprawdź, czy potrafisz ją przywrócić.';
 }
 // RX BIBI 4.7: bounded follow-up on the latest USER digital-safety question.
 // Ignore assistant text and stop at explicit topic switches.
 const everydayFollowup=/^(a jak (?:sie przed tym chronic|tego uniknac|to rozpoznac)|jak sie (?:przed tym chronic|zabezpieczyc)|podaj przyklad|daj przyklad)[?!. ]*$/.test(plain);
 if(everydayFollowup&&!everydayGuide){
  const turns=recentUserQuestions.slice().reverse();
  const boundary=turns.findIndex(turn=>/^(?:zmienmy temat|zmiana tematu|nowy temat|przejdzmy do innego tematu|teraz inny temat)\b/.test(normalizeRX(turn).trim()));
  const relevant=boundary<0?turns:turns.slice(0,boundary);
  const topic=relevant.map(normalizeRX).find(turn=>/\b(phishing|spam|haslo jednorazowe|kopia zapasowa|bezpieczne haslo)\b/.test(turn));
  if(topic){
   const example=/przyklad/.test(plain);
   if(/phishing/.test(topic))everydayGuide=example?
    '👑 Przykład phishingu: wiadomość udająca bank prosi o pilne kliknięcie linku i podanie hasła. Nie wpisuj danych przez taki link.':
    '👑 Aby unikać phishingu, nie otwieraj podejrzanych linków i sprawdzaj nadawcę. Do banku wchodź przez własną aplikację lub znany adres.';
   else if(/spam/.test(topic))everydayGuide=example?
    '👑 Przykład spamu: niezamówiona wiadomość reklamująca rzekomą nagrodę i prosząca o kliknięcie linku.':
    '👑 Nie odpowiadaj na podejrzany spam, nie otwieraj załączników i użyj funkcji zgłaszania lub blokowania nadawcy.';
   else if(/haslo jednorazowe|bezpieczne haslo/.test(topic))everydayGuide=example?
    '👑 Przykład silnego hasła: kilka losowych, niepowiązanych słów. Nie używaj przykładów podanych publicznie jako własnego hasła.':
    '👑 Nie udostępniaj haseł ani kodów jednorazowych. Stosuj unikalne hasła i weryfikację dwuetapową.';
   else if(/kopia zapasowa/.test(topic))everydayGuide=example?
    '👑 Przykład: trzymaj ważne zdjęcia na telefonie i osobną kopię na dysku zewnętrznym lub w zaufanej chmurze.':
    '👑 Przechowuj kopię oddzielnie od oryginału i okresowo sprawdzaj, czy możesz odzyskać pliki.';
  }
 }
 // RX BIBI 5.5: bounded contextual how-to for supported account safety topics.
 // Resolve only from USER turns and stop at an explicit topic switch.
 const contextualHowTo=/^(?:a\s+)?jak\s+(?:to\s+)?(?:wlaczyc|ustawic|uruchomic|zrobic)[?!. ]*$/.test(plain);
 if(contextualHowTo&&!everydayGuide){
  const turns=recentUserQuestions.slice().reverse().map(normalizeRX);
  const boundary=turns.findIndex(turn=>/^(?:zmienmy temat|zmiana tematu|nowy temat|przejdzmy do innego tematu|teraz inny temat)\b/.test(turn.trim()));
  const relevant=boundary<0?turns:turns.slice(0,boundary);
  const topicPatterns=[
   {pattern:/\b(2fa|weryfikacja dwuetapowa|uwierzytelnianie dwuskladnikowe)\b/,answer:'👑 Aby włączyć 2FA, otwórz ustawienia bezpieczeństwa konta i poszukaj opcji „Weryfikacja dwuetapowa” lub „2FA”. Wybierz metodę potwierdzania, zachowaj kody odzyskiwania w bezpiecznym miejscu. Podaj nazwę usługi, jeśli potrzebujesz dokładnych kroków.'},
   {pattern:/\b(kopia zapasowa|kopie zapasowa|backup|backupu)\b/,answer:'👑 Aby zrobić kopię zapasową, otwórz ustawienia kopii w urządzeniu lub aplikacji, wybierz zaufane miejsce zapisu i sprawdź możliwość przywrócenia danych. Podaj model telefonu lub nazwę aplikacji, jeśli chcesz dokładne kroki.'},
   {pattern:/\b(menedzer hasel|manager hasel|password manager)\b/,answer:'👑 Aby ustawić menedżer haseł, wybierz zaufaną aplikację, utwórz silne hasło główne i włącz 2FA, jeśli jest dostępne. Nie przesyłaj nikomu hasła głównego.'}
  ];
  const latestRelevant=relevant.map((turn,index)=>({turn,index,topic:topicPatterns.find(entry=>entry.pattern.test(turn))})).find(entry=>entry.topic);
  if(latestRelevant)everydayGuide=latestRelevant.topic.answer;
 }
 // RX BIBI 4.8: natural short follow-ups, strictly limited to a recent user topic.
 const everydayNaturalFollowup=/^(dlaczego|a co dalej|co dalej|mozesz prosciej|powiedz prosciej|(?:nie rozumiem(?: tego)?[, ]+)?(?:mozesz (?:mi )?(?:to )?)?(?:wytlumaczyc|wyjasnic|powiedziec) prosciej|nie rozumiem tego)[?!. ]*$/.test(plain);
 if(everydayNaturalFollowup&&!everydayGuide){
  const turns=recentUserQuestions.slice().reverse();
  const boundary=turns.findIndex(turn=>/^(?:zmienmy temat|zmiana tematu|nowy temat|przejdzmy do innego tematu|teraz inny temat)\b/.test(normalizeRX(turn).trim()));
  const relevant=boundary<0?turns:turns.slice(0,boundary);
  const topic=relevant.map(normalizeRX).find(turn=>/\b(phishing|spam|haslo jednorazowe|kopia zapasowa|bezpieczne haslo|2fa|weryfikacja dwuetapowa|uwierzytelnianie dwuskladnikowe)\b/.test(turn));
  if(topic){
   const why=/^dlaczego/.test(plain),simple=/prosciej|^nie rozumiem tego[?!. ]*$/.test(plain);
   if(/phishing/.test(topic))everydayGuide=why?'👑 Bo oszuści próbują skłonić Cię do ujawnienia haseł lub danych przez fałszywe wiadomości.':simple?'👑 Phishing to oszustwo przez fałszywą wiadomość. Nie podawaj haseł po kliknięciu linku.':'👑 Jeśli dostaniesz podejrzaną wiadomość, nie klikaj linku. Sprawdź sprawę w oficjalnej aplikacji lub na znanej stronie.';
   else if(/spam/.test(topic))everydayGuide=why?'👑 Spam bywa wysyłany masowo, aby reklamować produkty albo nakłonić do kliknięcia niebezpiecznego linku.':simple?'👑 Spam to niechciane wiadomości. Możesz je zablokować lub zgłosić.':'👑 Zablokuj nadawcę, zgłoś spam i nie otwieraj podejrzanych załączników.';
   else if(/haslo jednorazowe|bezpieczne haslo/.test(topic))everydayGuide=why?'👑 Unikalne hasła i kody pomagają chronić konto przed przejęciem.':simple?'👑 Nie udostępniaj hasła ani kodu. Każde konto powinno mieć inne hasło.':'👑 Włącz weryfikację dwuetapową i użyj menedżera haseł.';
   else if(/kopia zapasowa/.test(topic))everydayGuide=why?'👑 Bo telefon lub dysk może się zepsuć, a dodatkowa kopia pozwala odzyskać pliki.':simple?'👑 Kopia zapasowa to dodatkowy zapis Twoich plików na wypadek ich utraty.':'👑 Zapisz kopię ważnych plików osobno i sprawdź, czy można ją odtworzyć.';
   else if(/\b(2fa|weryfikacja dwuetapowa|uwierzytelnianie dwuskladnikowe)\b/.test(topic))everydayGuide=why?'👑 2FA dodaje drugi krok sprawdzania tożsamości, żeby samo hasło nie wystarczyło do zalogowania.':simple?'👑 2FA to dodatkowe potwierdzenie logowania, na przykład kodem z aplikacji.':'👑 Otwórz ustawienia bezpieczeństwa konta i włącz weryfikację dwuetapową.';
  }
 }
 // RX BIBI 5.7: examples and reasons for additional recent safety topics.
 // Never use assistant text or a topic older than an explicit switch.
 if(/^(?:a )?dlaczego|^(?:podaj|daj) przyklad[?!. ]*$/.test(plain)&&!everydayGuide){
  const turns=recentUserQuestions.slice().reverse().map(normalizeRX);
  const boundary=turns.findIndex(turn=>/^(?:zmienmy temat|zmiana tematu|nowy temat|przejdzmy do innego tematu|teraz inny temat)\b/.test(turn.trim()));
  const relevant=boundary<0?turns:turns.slice(0,boundary);
  const supported=[
   {pattern:/\b(2fa|weryfikacja dwuetapowa|uwierzytelnianie dwuskladnikowe)\b/,why:'👑 2FA chroni konto dodatkowym potwierdzeniem, nawet gdy ktoś pozna hasło.',example:'👑 Przykład 2FA: po wpisaniu hasła potwierdzasz logowanie kodem z aplikacji.'},
   {pattern:/\b(menedzer hasel|manager hasel|password manager)\b/,why:'👑 Menedżer haseł pomaga używać różnych, silnych haseł bez zapamiętywania każdego z nich.',example:'👑 Przykład: menedżer tworzy osobne hasło dla poczty i sklepu, a Ty pamiętasz tylko hasło główne.'},
   {pattern:/\b(aktualizacja|aktualizacje|update|aktualizacja oprogramowania)\b/,why:'👑 Aktualizacje często usuwają luki bezpieczeństwa i naprawiają błędy.',example:'👑 Przykład: aktualizacja telefonu naprawia błąd systemu i poprawia zabezpieczenia.'}
  ];
  const latest=relevant.map(turn=>supported.find(entry=>entry.pattern.test(turn))).find(Boolean);
  if(latest)everydayGuide=/przyklad/.test(plain)?latest.example:latest.why;
 }
 // RX BIBI 4.9: distinguish explaining an action from asking to execute it.
 // Customer chat stays read-only; do not suggest an account action was performed.
 const actionExplain=/^(?:jak|w jaki sposob)\s+(?:usunac|zmienic|zresetowac)\s+(?:moje\s+)?(konto|haslo|dane)[?!. ]*$/.test(plain);
 const actionExecute=/^(?:usun|usun mi|zmien|zmien mi|zresetuj|zresetuj mi)\s+(?:moje\s+)?(konto|haslo|dane)[?!. ]*$/.test(plain);
 if(actionExplain){
  const subject=plain.match(/(konto|haslo|dane)[?!. ]*$/)?.[1];
  everydayGuide=subject==='haslo'?
   '👑 Aby zmienić lub zresetować hasło, otwórz ustawienia konta albo oficjalny formularz odzyskiwania dostępu. Nie podawaj hasła w czacie.':
   '👑 Aby zmienić lub usunąć dane konta, sprawdź ustawienia prywatności i konta w danej usłudze. Napisz, o którą usługę chodzi, a pomogę znaleźć właściwą instrukcję.';
 }
 if(actionExecute){
  everydayGuide='👑 Rozumiem prośbę o wykonanie działania na koncie. Ten czat nie ma uprawnień do zmiany ani usuwania konta, hasła lub danych. Mogę wyjaśnić, jak zrobić to bezpiecznie w ustawieniach odpowiedniej usługi.';
 }
 // RX BIBI 5.0: useful everyday questions, without pretending to access a device.
 const everydayPractical=/^(?:jak|w jaki sposob)\s+(?:sprawdzic|zrobic)\s+(?:czy\s+)?(link jest bezpieczny|aktualizacje telefonu|miejsce w telefonie|kopia zapasowa telefonu)[?!. ]*$/.test(plain);
 if(everydayPractical){
  const subject=plain.match(/(link jest bezpieczny|aktualizacje telefonu|miejsce w telefonie|kopia zapasowa telefonu)[?!. ]*$/)?.[1];
  const guides={
   'link jest bezpieczny':'👑 Sprawdź dokładny adres i domenę, nie otwieraj podejrzanych skrótów i nie podawaj danych po kliknięciu linku. Sam wygląd strony nie dowodzi bezpieczeństwa.',
   'aktualizacje telefonu':'👑 Otwórz ustawienia telefonu i znajdź Aktualizacja oprogramowania lub System → Aktualizacje. Nazwy opcji zależą od modelu.',
   'miejsce w telefonie':'👑 Otwórz Ustawienia → Pamięć lub Pamięć urządzenia. Sprawdź, co zajmuje miejsce, zanim usuniesz pliki.',
   'kopia zapasowa telefonu':'👑 Otwórz ustawienia kopii zapasowej telefonu, wybierz zaufane miejsce zapisu i sprawdź, czy można przywrócić dane.'
  };
  everydayGuide=guides[subject]??null;
 }
 // RX BIBI 5.1: reusable intent + topic resolver, not one regex per question.
 // RX BIBI 5.3: remove only known polite question prefixes.
 // Keep the rest intact so intent and topic matching stay deterministic.
 const politeIntentQuestion=plain.replace(/,\s*/g,' ').replace(/^(?:(?:czy\s+)?mozesz\s+(?:mi\s+)?|prosze\s+)(?=(?:wyjasnic|wyjasnij|powiedziec|powiedz)\b)/,'')
  .replace(/^(?:wyjasnic|wyjasnij|powiedziec|powiedz)\s+(?:mi\s+)?(?=(?:czym|co)\b)/,'')
  .replace(/^(?:czy\s+)?moglabys\s+(?:mi\s+)?wyjasnic\s+(?=(?:czym|co)\b)/,'');
 const conversationalTokens=politeIntentQuestion.replace(/[?!.]+$/g,'').trim().split(/\s+/).filter(Boolean);
 const intentPatterns=[
  {intent:'definition',prefixes:[['co','oznacza'],['co','to','znaczy'],['czym','jest']]},
  {intent:'example',prefixes:[['pokaz','przyklad'],['przyklad','dla']]},
  {intent:'protection',prefixes:[['jak','unikac'],['jak','rozpoznac']]}
 ];
 const normalizedTopicAliases=[
  {id:'phishing',words:['phishing','phishingu','fishing','fishingu']},
  {id:'spam',words:['spam','spamu']},
  {id:'haslo',words:['haslo','hasla']},
  {id:'link',words:['link','linku']},
  {id:'kopia zapasowa',words:['backup','backupu','kopii zapasowej','kopie zapasowa']},
  {id:'weryfikacja dwuetapowa',words:['2fa','weryfikacja dwuetapowa','uwierzytelnianie dwuskladnikowe']},
  {id:'aktualizacja',words:['aktualizacja','aktualizacje','update','aktualizacja oprogramowania']},
  {id:'menedzer hasel',words:['menedzer hasel','manager hasel','password manager']}
 ];
 const matchedIntent=intentPatterns.flatMap(({intent,prefixes})=>prefixes.filter(prefix=>prefix.every((word,index)=>conversationalTokens[index]===word)).map(prefix=>({intent,rest:conversationalTokens.slice(prefix.length).join(' ')})))[0];
 const matchedTopic=matchedIntent&&normalizedTopicAliases.find(topic=>topic.words.some(word=>matchedIntent.rest===word));
 if(matchedTopic){
  const subject=matchedTopic.id;
  if(matchedIntent.intent==='definition'){
   const definitions={
    phishing:'👑 Phishing to oszustwo, w którym ktoś podszywa się pod zaufaną instytucję, aby wyłudzić dane.',
    spam:'👑 Spam to niechciane wiadomości, często wysyłane masowo.',
    haslo:'👑 Hasło to sekret chroniący dostęp do konta. Nie przekazuj go innym.',
    link:'👑 Link to adres prowadzący do strony lub pliku. Sprawdź domenę przed otwarciem.',
    'kopia zapasowa':'👑 Kopia zapasowa to dodatkowy zapis danych potrzebny do ich odzyskania.',
    'weryfikacja dwuetapowa':'👑 Weryfikacja dwuetapowa (2FA) wymaga dodatkowego potwierdzenia logowania oprócz hasła.',
    aktualizacja:'👑 Aktualizacja oprogramowania wprowadza poprawki bezpieczeństwa, naprawy błędów lub nowe funkcje.',
    'menedzer hasel':'👑 Menedżer haseł pomaga przechowywać i tworzyć unikalne hasła do różnych kont.'
   };
   everydayGuide=definitions[subject];
  }else if(matchedIntent.intent==='example'){
   everydayGuide=subject==='phishing'?'👑 Przykład phishingu: fałszywy SMS od banku z linkiem do logowania.':subject==='spam'?'👑 Przykład spamu: niezamówiona reklama przesłana do wielu osób.':'👑 Podaj konkretną sytuację, a przygotuję bezpieczny przykład dotyczący: '+subject+'.';
  }else if(matchedIntent.intent==='protection'){
   everydayGuide=subject==='phishing'?'👑 Sprawdzaj nadawcę i adres strony; nie podawaj danych przez podejrzane linki.':subject==='spam'?'👑 Blokuj nadawców spamu i nie otwieraj podejrzanych załączników.':'👑 W sprawie '+subject+' najpierw sprawdź źródło i nie udostępniaj danych osobowych.';
  }
 }
 const everydayIdentity=/^(kim jestes|jak masz na imie|jak sie nazywasz)[?!. ]*$/.test(plain);
 const everydayWeather=/^(jaka (jest )?pogoda|czy bedzie padac|ile jest stopni)[?!. ]*$/.test(plain);
 const everydayTime=/^(ktora (jest )?godzina|jaki (jest )?dzis dzien|jaka (jest )?data)[?!. ]*$/.test(plain);
 const everydayJoke=/^(opowiedz zart|powiedz zart|znasz jakis zart)[?!. ]*$/.test(plain);
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
 else if(correction)answer=/chodzi(?:lo)? mi o (?:inny|cos innego) temat|mialem na mysli cos innego/.test(normalizeRX(message.trim()))?'👑 Rozumiem, chodziło Ci o inny temat. Napisz jego nazwę lub pytanie, a zaczniemy od niego bez zgadywania.':'👑 Rozumiem, poprzednia odpowiedź nie trafiła w Twoje pytanie. '+(currentUserTopic?'W temacie „'+currentUserTopic.slice(0,140)+'” ':'')+'napisz proszę, co konkretnie mam zmienić lub wyjaśnić. Nie będę zgadywać Twojej intencji.';
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
 else if(asksCloud)answer='☁️ Cloudflare udostępnia panel RX w chmurze. Chmura RX korzysta z Cloudflare do udostępniania panelu, a GitHub Actions uruchamia zatwierdzone testy. Status wdrożenia i raporty trzeba sprawdzać osobno; sam czat nie potwierdza publikacji.';
 else if(asksTurbine)answer='⚙️ RX Wirnik służy do ograniczonego, równoległego wykonywania zatwierdzonych testów. Nie zwiększa fizycznej mocy komputera. Ostatni przebieg sprawdzisz w panelu Królowej przez „RX Wirnik — ostatni przebieg”. Samo pytanie nie uruchamia pracy.';
 else if(asksAnts&&/(jak|sposob|zwieksz|moc|wydajn|przyspiesz|optymaliz|ulepsz)/.test(plain))answer='🐜 Możemy zwiększyć skuteczność RX Mrówek w trzech krokach: 1) grupować podobne zadania i usuwać duplikaty, 2) uruchamiać niezależne testy równolegle z limitem obciążenia, 3) zapisywać czas, błędy i wyniki, aby poprawiać najwolniejsze moduły. Zacznijmy od pomiaru czasu obecnych testów — bez uruchamiania czegokolwiek bez Twojej zgody.';
 else if(asksAnts)answer='🐜 Mrówki RX to moduły zadań i testów, nie niezależne istoty AI. Mogę zaplanować ich pracę, ale rzeczywiste wykonanie wymaga zatwierdzenia i uruchomienia wykonawcy. Stan kolejki sprawdzisz w kategorii Mrówki.';
 else if(asksBuilding)answer='👑 Rozwijamy RX etapami: mózg rozmowy, Mrówki i Wirnik. W tym czacie mogę przygotować plan, wyjaśnić stan systemu i wskazać testy. Nie mogę twierdzić, że samodzielnie buduję lub wykonuję zadania w tle.';
 else if(asksStatus)answer='👑 Czat RX odpowiada przez serwerowy planer. Aby poznać rzeczywisty stan pracy, wybierz „Odśwież raport RX Coordinator” albo „RX Wirnik — ostatni przebieg”. Nie mam tutaj transmisji pracy Mrówek na żywo.';
 else if(asksHelp)answer='👑 Napisz np. „Co robią Mrówki?”, „Jak działa Wirnik?”, „Jakie testy wykonać?” lub „Co budujemy dalej?”. Mogę prowadzić rozmowę i przygotowywać bezpieczne plany.';
 else if(topics.length)answer='👑 Rozumiem temat: '+[...new Set(topics)].join(', ')+'. Mogę pomóc przygotować plan testów i wyjaśnić kolejne kroki. Niczego nie uruchomiłam bez zatwierdzenia.';
 else if(/^(?:a )?(?:dlaczego|czemu|jak to|co to znaczy)[?!. ]*$/i.test(plain)&&latestUserTurn&&latestUserTurn.trim()&&!/^(?:a )?(?:dlaczego|czemu|dalej)[?!. ]*$/i.test(normalizeRX(latestUserTurn.trim()))){
  // Preserve the user's own latest question for a short follow-up; never invent facts.
  const original=latestUserTurn.trim().slice(0,240);
  answer='👑 Nawiązujesz do pytania: „'+original+'”. Nie mam jeszcze pewnej odpowiedzi, ale pamiętam, o co pytasz. Możemy doprecyzować ten temat.';
 }
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
 // Rotate harmless conversational wording when the immediately preceding answer is identical.
 // RX BIBI 3.3: safe clarification for an ambiguous reference after topic changes.
 // Do not silently attach a pronoun to an unrelated module or invent a topic.
 const vagueReference=/^(?:a co z (?:nim|nia|nimi|tym)|co z (?:nim|nia|nimi|tym)|a (?:on|ona|one|oni|to))[?!. ]*$/i.test(plain);
 const explicitUserTopics=userTurns.map(topicLabel).filter(Boolean);
 // Keep only distinct recent subjects in conversational order; avoid asking
 // the customer to choose between duplicates of the same subject.
 const distinctRecentTopics=[...new Set(explicitUserTopics.slice(-3))];
 if(vagueReference&&distinctRecentTopics.length>1){
  answer='👑 O który temat pytasz: '+distinctRecentTopics.join(' czy ')+'? Doprecyzuj, żebym nie pomyliła wątków.';
  tasks.length=0;plan.work=null;
 }
 // RX BIBI 3.4: honor an explicit answer to the immediately preceding clarification.
 const previousClarification=history.length>=2?String(history.at(-1)||''):'';
 const clarificationOptions=previousClarification.match(/^👑 O który temat pytasz: (.+)\\? Doprecyzuj,/);
 // A one-word topic answer is valid only when that option was actually offered.

 const chosenTopic=clarificationOptions?explicitTopicNames.find(([label])=>normalizeRX(message.trim()).replace(/[?.! ]+$/g,'')===normalizeRX(label)&&clarificationOptions[1].includes(label))?.[0]:null;
 if(chosenTopic){
  answer='👑 Rozumiem, chodzi o '+chosenTopic+'. Napisz, co konkretnie chcesz wiedzieć o tym temacie.';
  tasks.length=0;plan.work=null;
 }
 // A clarification or explicit choice takes precedence over generic module replies.
 if((vagueReference&&distinctRecentTopics.length>1)||chosenTopic){
  const safeAnswer=answer;
  return {ok:true,answer:safeAnswer,topics:[],tasks:[],plan:{...plan,work:null},learning:rxLearning,contextUsed:true,multiIntent:false,intents:[],executed:0,modelInferenceUsed:false};
 }
 const recentAssistantAnswer=history.length>=2?String(history.at(-1)||''):'';
 const repeatedGreeting=recentAssistantAnswer.includes('Co u Ciebie słychać?');
 const repeatedThanks=recentAssistantAnswer.includes('Jeśli masz kolejne pytanie');
 const repeatedQuestion=recentAssistantAnswer.includes('Jeśli nie będę znała odpowiedzi');
 if(everydayGreeting)answer=repeatedGreeting?'👑 Miło Cię znowu słyszeć. O czym chcesz dziś porozmawiać?':'👑 Dziękuję, że pytasz! Jestem tutaj, żeby porozmawiać. Co u Ciebie słychać?';
 if(everydayThanks)answer=repeatedThanks?'👑 Cała przyjemność po mojej stronie. Co jeszcze mogę wyjaśnić?':'👑 Nie ma za co! Jeśli masz kolejne pytanie, śmiało napisz.';
 if(everydayQuestion)answer=repeatedQuestion?'👑 Słucham. Opisz konkretną sytuację albo zadaj pytanie, a postaram się pomóc.':'👑 Jasne, napisz, w czym potrzebujesz pomocy. Jeśli nie będę znała odpowiedzi, powiem o tym wprost.';
 // Keep an explicit recent user topic even when it has no RX-specific keywords.
 // This is a conversational reply only: never infer an action or execute a tool.
 const genericContinuation=/^(?:dalej|kontynuuj|rozwin to|rozwiń to)[.!? ]*$/i.test(message.trim());
 const nonTopicTurn=/^(?:dalej|kontynuuj|gotowe|ok|super|zielone|blad|błąd|dzieki|dzięki|tak|nie)[.!? ]*$/i;
 const topicTurns=latestSwitch>=0?userTurns.slice(latestSwitch+1):userTurns;
 const lastUserTopic=topicTurns.slice().reverse().find(turn=>turn.trim().length>=8&&!nonTopicTurn.test(turn.trim())&&!topicSwitch.test(normalizeRX(turn.trim())))||'';
 // RX BIBI: a short continuation after an explicit topic switch must not revive an old subject.
 const recentBoundary=latestSwitch>=0?userTurns.slice(latestSwitch+1):userTurns;
 const continuationSubject=recentBoundary.slice().reverse().find(turn=>turn.trim().length>=8&&!nonTopicTurn.test(turn.trim())&&!topicSwitch.test(normalizeRX(turn.trim())))||'';
 const genericTopicAllowed=Boolean(continuationSubject)&&(latestSwitch<0||userTurns.lastIndexOf(continuationSubject)>latestSwitch);
 if(genericContinuation&&!activeTopic&&continuationSubject&&genericTopicAllowed){
  answer='👑 Kontynuujemy temat: „'+continuationSubject.slice(0,140)+'”. Napisz, który aspekt mam rozwinąć, żebym nie dopowiadała nieznanych faktów.';
  tasks.length=0;plan.work=null;
 }
 // Respond to an ordinary invitation to discuss a topic, without pretending to know facts.
 const ordinaryConversation=/^(?:(?:cześć|czesc|hej|witaj|dzień dobry|dzien dobry)(?:\s+bibi)?[,! ]+)?(?:chc[eę]|chcialbym|chciałbym|mozemy|możemy|porozmawiajmy|pogadajmy)\s+(?:(?:porozmawia[cć]|pogada[cć])\s+)?o\s+(.{3,140})[.!? ]*$/i.exec(message.trim());
 if(ordinaryConversation){
  const subject=ordinaryConversation[1].replace(/[.!? ]+$/g,'');
  if(/mrow(?:e)?k|mrów(?:e)?k/i.test(normalizeRX(subject))&&/moc|wydajn|przyspiesz|zwieksz|zwiększ|ulepsz/i.test(normalizeRX(subject))){
   answer='👑 Aby zwiększyć moc mrówek RX, proponuję trzy kroki: 1) mierzyć czas każdego zadania i znaleźć najwolniejsze etapy; 2) uruchamiać niezależne zadania równolegle z limitem obciążenia; 3) zapisywać wyniki i automatycznie powtarzać tylko nieudane testy. Najpierw porównajmy czas i skuteczność obecnych testów. To plan, nie wykonana zmiana.';
  }else answer='👑 Jasne, porozmawiajmy o '+subject+'. Co najbardziej Cię w tym temacie interesuje?';
  tasks.length=0;plan.work=null;
 }
 // RX BIBI: a safe, useful next step for a garden conversation, using recent user context.
 // This is practical guidance, not a claim of live weather, soil measurements or AI inference.
 const gardenContext=/\b(ogrod|ogrodzie|ogrodu|ogrodem|roslin|rosliny|kwiat|warzyw|grzadk|trawnik)\b/i.test(plain)
  ||userTurns.slice(-6).some(turn=>/\b(ogrod|ogrodzie|ogrodu|ogrodem|roslin|rosliny|kwiat|warzyw|grzadk|trawnik)\b/i.test(normalizeRX(turn)));
 const gardenNext=/^(?:dalej|kontynuuj|rozwin to|rozwiń to|co dalej)[.!? ]*$/i.test(message.trim());
 const gardenPlanting=/(co|jakie|ktore|kiedy|gdzie).{0,45}(posadzic|sadzic|wysiac|uprawiac)|(?:chce|chcialbym).{0,30}(posadzic|sadzic)/i.test(plain);
 const gardenCare=/(jak|czym|kiedy).{0,40}(podlewac|nawozic|pielegnowac)|(?:podlewanie|nawozenie)/i.test(plain);
 if(gardenContext&&(latestSwitch<0||userTurns.slice(latestSwitch+1).some(turn=>/ogrod|roslin|kwiat|warzyw|grzadk|trawnik/i.test(normalizeRX(turn))))&&(gardenNext||gardenPlanting||gardenCare)){
  if(gardenPlanting&&/pomidor\w*/i.test(plain))answer='👑 Pomidory w małym ogrodzie to dobry kierunek. Zwykle potrzebują dużo słońca, żyznej ziemi i regularnego podlewania. Czy miejsce, w którym chcesz je posadzić, jest słoneczne przez większość dnia?';
  else if(gardenPlanting)answer='👑 Dobór roślin zależy od słońca, rodzaju ziemi i miejsca. Na początek ustalmy: czy chcesz warzywa, kwiaty czy krzewy? I czy miejsce jest słoneczne, czy zacienione? Wtedy podam konkretne propozycje.';
  else if(gardenCare)answer='👑 Najpierw sprawdź wilgotność ziemi kilka centymetrów pod powierzchnią; nie podlewaj wyłącznie według kalendarza. Powiedz, jakie rośliny masz w ogrodzie i czy rosną w gruncie czy donicach, a dopasujemy pielęgnację.';
  else if(history.slice(-4).some(turn=>/Ile masz miejsca, czy jest tam dużo słońca/i.test(turn)))answer='👑 Możemy zacząć od prostego planu: wybierz miejsce na rośliny, sprawdź ile dociera tam słońca i oceń wilgotność ziemi. Co wolisz zaplanować najpierw — warzywnik czy kwiaty?';
  else answer='👑 Wracamy do rozmowy o moim ogrodzie. Ile masz miejsca, czy jest tam dużo słońca i co chcesz osiągnąć — warzywnik, kwiaty czy miejsce do odpoczynku? Od tego zależy sensowny plan.';
  tasks.length=0;plan.work=null;
 }
 // RX BIBI: interpret the user's answer to a previous garden question, not just "Dalej".
 const recentGardenTopic=topicTurns.slice(-6).some(turn=>/\b(ogrod|ogrodzie|ogrodu|ogrodem|rosliny|warzywa|kwiaty)\b/i.test(normalizeRX(turn)));
 const recentGardenAnswer=history.slice(-4).some(turn=>/warzywnik|kwiaty czy|słoneczne|zacienione|ile masz miejsca|dużo słońca/i.test(turn));
 const gardenDetail=/\b(slonce|sloneczn\w*|cien\w*|zacienion\w*|maly|niewielki|duzy|warzywa|kwiaty|krzewy|pomidor\w*|ziemia|gleba)\b/i.test(plain);
 if(recentGardenTopic&&recentGardenAnswer&&gardenDetail&&!gardenPlanting&&!gardenCare&&!gardenNext&&!ordinaryConversation){
  if(/cien|zacienion/.test(plain))answer='👑 Jeśli ogród jest zacieniony, rozważ rośliny tolerujące cień, np. funkie lub paprocie. Ważne też, czy ziemia jest wilgotna czy sucha. Jak jest u Ciebie?';
  else if(/slonce|sloneczn/.test(plain))answer='👑 W słonecznym miejscu możesz rozważyć zioła, lawendę lub pomidory, zależnie od gleby i ilości miejsca. Wolisz rośliny jadalne czy ozdobne?';
  else if(/maly|niewielki/.test(plain))answer='👑 W małym ogrodzie warto zacząć od kilku rabat lub donic i zostawić wygodne przejście. Co jest ważniejsze: warzywa, kwiaty czy miejsce do siedzenia?';
  else if(/warzywa|pomidor/.test(plain))answer='👑 Przy warzywach zacznij od sprawdzenia słońca i jakości gleby. Pomidory zwykle potrzebują dużo światła. Ile godzin słońca ma Twoje miejsce?';
  else if(/kwiaty/.test(plain))answer='👑 Dobierzmy kwiaty do warunków: czy rabata jest słoneczna czy zacieniona i czy chcesz kwitnienie przez całe lato?';
  else answer='👑 Rozumiem. Żeby dobrze dobrać rośliny, potrzebuję jeszcze informacji o słońcu i rodzaju ziemi w Twoim ogrodzie.';
  tasks.length=0;plan.work=null;
 }
 // A direct topic invitation takes priority over the generic conversation greeting.
 const directTopicInvitation=/^(?:porozmawiajmy|pogadajmy)\s+o\s+(.{3,140})[.!? ]*$/i.exec(message.trim());
 if(directTopicInvitation){
  const subject=directTopicInvitation[1].replace(/[.!? ]+$/g,'');
  if(/mrow(?:e)?k|mrów(?:e)?k/i.test(normalizeRX(subject))&&/moc|wydajn|przyspiesz|zwieksz|zwiększ|ulepsz/i.test(normalizeRX(subject))){
   answer='👑 Aby zwiększyć moc mrówek RX, proponuję trzy kroki: 1) mierzyć czas każdego zadania i znaleźć najwolniejsze etapy; 2) uruchamiać niezależne zadania równolegle z limitem obciążenia; 3) zapisywać wyniki i automatycznie powtarzać tylko nieudane testy. Najpierw porównajmy czas i skuteczność obecnych testów. To plan, nie wykonana zmiana.';
  }else answer='👑 Jasne, porozmawiajmy o '+subject+'. Co najbardziej Cię w tym temacie interesuje?';
  tasks.length=0;plan.work=null;
 }
 // Session-only follow-up to the RX Ants explanation; never claim work was executed.
 const rxAntRecentUserTurns=history.filter((_,i)=>i%2===0).slice(-4);
 const rxAntLastTopicTurn=[...rxAntRecentUserTurns].reverse().find(turn=>/(?:porozmawiajmy|pogadajmy)\s+o\s+|(?:teraz|zmieńmy|zmienmy)\s+(?:porozmawiajmy|pogadajmy)/iu.test(turn));
 const rxAntPrevious=Boolean(rxAntLastTopicTurn&&/mr[oó]wk/iu.test(rxAntLastTopicTurn)&&/(?:przyk[lł]ad|modu[lł]|wsp[oó]ln)/iu.test(rxAntLastTopicTurn));
 const rxAntSecond=rxAntPrevious&&/^(?:podaj|wyja[sś]nij|rozwi[nń])\s+(?:mi\s+)?(?:drugi|2\.?)(?:\s+przyk[lł]ad\w*)?[.!? ]*$/iu.test(message.trim());
 if(rxAntSecond){
  answer='👑 Drugi przykład: jedna RX Mrówka zbiera wyniki testów, druga wyszukuje powtarzające się błędy, a trzecia przygotowuje czytelne podsumowanie dla operatora. Koordynator porównuje wyniki przed zaproponowaniem poprawek. To przykład możliwej współpracy, nie informacja o wykonanym teście.';
  tasks.length=0;plan.work=null;
 }
 // Answer an explicit educational request rather than echoing it as a topic invitation.
 const rxAntExamples=/rx\\s+mr[oó]wk|mr[oó]wk/iu.test(message)
  &&/(?:wyja[sś]nij|podaj|przyk[lł]ad|jak\\s+grupa)/iu.test(message)
  &&/(?:modu[lł]|wsp[oó]ln|zadani)/iu.test(message);
 if(rxAntExamples){
  answer='👑 RX Mrówki mogą współpracować jak zespół małych modułów: każdy wykonuje wyznaczoną część pracy, a koordynator łączy i sprawdza wyniki. Trzy przykłady: 1) jedna mrówka analizuje błąd kodu, druga proponuje poprawkę, trzecia uruchamia testy; 2) jedna zbiera wyniki testów, druga wykrywa powtarzające się problemy, trzecia przygotowuje podsumowanie; 3) jedna dzieli duże zadanie na części, kilka wykonuje niezależne obliczenia, a koordynator porównuje rezultaty. To opis możliwej architektury, nie potwierdzenie, że te działania zostały teraz wykonane.';
  tasks.length=0;plan.work=null;
 }
 if(shortReplyAnswer!==null)answer=shortReplyAnswer;
 if(arithmeticAnswer!==null)answer=arithmeticAnswer;
 if(everydayGuide!==null)answer=everydayGuide;
 if(returnTopic&&previousLabel)answer='👑 Wracamy do tematu: '+previousLabel+'. Napisz, co konkretnie chcesz o nim wiedzieć, a nie będę zgadywać.';
 if(everydayIdentity)answer='👑 Jestem BIBI, asystentką rozmowy RX. Mogę wyjaśniać wybrane tematy i pomagać w planowaniu, ale nie jestem niezależnym modelem AI.';
 if(everydayWeather)answer='👑 Nie mam tutaj dostępu do aktualnej prognozy pogody. Podaj miejscowość, a podpowiem, gdzie sprawdzić wiarygodną prognozę.';
 if(everydayTime)answer='👑 Nie mam w tym czacie wiarygodnego zegara ani bieżącej daty. Sprawdź godzinę i datę w telefonie.';
 if(everydayJoke)answer='👑 Dlaczego programista zabrał parasol? Bo zapowiadali chmurę! ☁️';
 if(correction||shortReplyAnswer!==null||everydayGreeting||everydayThanks||everydayQuestion||everydayIdentity||everydayWeather||everydayTime||everydayJoke||arithmeticAnswer!==null||everydayGuide!==null||(returnTopic&&previousLabel)){tasks.length=0;plan.work=null;}
 return {ok:true,answer,topics,tasks,plan,learning:rxLearning,contextUsed:followupContext,multiIntent,intents:selectedParts.map(x=>x.id),executed:0,modelInferenceUsed:false};
}
