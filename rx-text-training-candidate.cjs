'use strict';
// Experimental samples: do not copy held-out benchmark prompts.
const {createLearner}=require('./rx-text-learner.cjs');
const {HOLDOUT,CHALLENGE}=require('./rx-text-evaluation.cjs');
const EXTRAS=Object.freeze([
 ['halo moja królowo','greeting'],['dobrego dnia życzę','greeting'],
 ['przesyłam pozdrowienia','greeting'],['cieszę się że rozmawiamy','greeting'],
 ['witam cię ponownie','greeting'],['miło z tobą rozmawiać','greeting'],
 ['sprawdzenie kodu zakończone','tests'],['czy kontrola działa poprawnie','tests'],
 ['jak wypadła weryfikacja','tests'],['zobacz raport błędów','tests'],
 ['pokaż rezultaty kontroli','tests'],['czy wszystko przeszło sprawdzanie','tests'],
 ['wróćmy do naszych planów','memory'],['co wcześniej uzgodniliśmy','memory'],
 ['odszukaj stare wiadomości','memory'],['czy zachowałaś poprzednie informacje','memory'],
 ['opowiedz o poprzednim projekcie','memory'],['przywołaj dawne ustalenia','memory'],
 ['jaka suma liczb','math'],['wyznacz różnicę wartości','math'],
 ['oblicz dzielenie liczb','math'],['wylicz wynik działania','math'],
 ['policz połowę ceny','math'],['jaki rezultat mnożenia','math']
]);
// Repo-maintained synthetic examples are explicitly approved only for offline evaluation.
const approvedOffline=rows=>rows.map(([text,label])=>[{text,approvedForTraining:true},label]);
function score(model,set){return set.reduce((n,[phrase,label])=>n+(model.classify(phrase).label===label),0)}
function compare(){
 const settings={epochs:180,hidden:24,rate:0.06};
 const baseline=createLearner(settings);
 const candidate=createLearner({...settings,additionalExamples:approvedOffline(EXTRAS)});
 const old={holdout:score(baseline,HOLDOUT),challenge:score(baseline,CHALLENGE)};
 const next={holdout:score(candidate,HOLDOUT),challenge:score(candidate,CHALLENGE)};
 return {kind:'rx-offline-candidate',trainingSamples:candidate.examples,baseline:old,candidate:next,
  improvesBoth:next.holdout>=old.holdout&&next.challenge>=old.challenge&&(next.holdout>old.holdout||next.challenge>old.challenge),
  productionConnected:false};
}

const WAVE2=Object.freeze([
 ['hejka witam ponownie','greeting'],['przyjemnego popołudnia','greeting'],
 ['pozdrawiam serdecznie wszystkich','greeting'],['witajcie po dłuższej przerwie','greeting'],
 ['jak wygląda kontrola jakości','tests'],['czy sprawdzian się powiódł','tests'],
 ['podsumuj weryfikację działania','tests'],['czy automatyczne sprawdzanie działa','tests'],
 ['odtwórz nasze wcześniejsze rozmowy','memory'],['pokaż co zostało zapamiętane','memory'],
 ['wróć do wcześniejszego pomysłu','memory'],['przywołaj informacje z wczoraj','memory'],
 ['oblicz sumę kilku wartości','math'],['jaki wynik podziału','math'],
 ['pomnóż kwotę przez ilość','math'],['wyznacz połowę sumy','math']
]);
function compareWave2(){
 const settings={epochs:180,hidden:24,rate:0.06};
 const previous=createLearner({...settings,additionalExamples:approvedOffline(EXTRAS)});
 const next=createLearner({...settings,additionalExamples:approvedOffline(EXTRAS.concat(WAVE2))});
 const old={holdout:score(previous,HOLDOUT),challenge:score(previous,CHALLENGE)};
 const candidate={holdout:score(next,HOLDOUT),challenge:score(next,CHALLENGE)};
 return {kind:'rx-offline-wave2',trainingSamples:next.examples,previous:old,candidate,
  improvesBoth:candidate.holdout>=old.holdout&&candidate.challenge>=old.challenge&&(candidate.holdout>old.holdout||candidate.challenge>old.challenge),
  productionConnected:false};
}


function errorBreakdown(learner,set){
 const labels=['greeting','tests','memory','math'];
 const byLabel=Object.fromEntries(labels.map(label=>[label,{correct:0,total:0,errors:[]}]));
 for(const [phrase,expected] of set){
  const predicted=learner.classify(phrase).label;
  const row=byLabel[expected];row.total++;
  if(predicted===expected)row.correct++;
  else row.errors.push({phrase,predicted});
 }
 return byLabel;
}
function diagnoseWave2(){
 const model=createLearner({epochs:180,hidden:24,rate:0.06,additionalExamples:approvedOffline(EXTRAS.concat(WAVE2))});
 return {kind:'rx-offline-wave2-diagnosis',trainingSamples:model.examples,
  holdout:errorBreakdown(model,HOLDOUT),challenge:errorBreakdown(model,CHALLENGE),
  productionConnected:false};
}

if(require.main===module){console.log('RX TRAINING CANDIDATE',JSON.stringify(compare()));console.log('RX TRAINING WAVE2',JSON.stringify(compareWave2()));console.log('RX WAVE2 DIAGNOSIS',JSON.stringify(diagnoseWave2()));}
module.exports={EXTRAS,WAVE2,compare,compareWave2,diagnoseWave2};
