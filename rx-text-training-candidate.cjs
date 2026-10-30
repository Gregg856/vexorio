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
function score(model,set){return set.reduce((n,[phrase,label])=>n+(model.classify(phrase).label===label),0)}
function compare(){
 const settings={epochs:180,hidden:24,rate:0.06};
 const baseline=createLearner(settings);
 const candidate=createLearner({...settings,additionalExamples:EXTRAS});
 const old={holdout:score(baseline,HOLDOUT),challenge:score(baseline,CHALLENGE)};
 const next={holdout:score(candidate,HOLDOUT),challenge:score(candidate,CHALLENGE)};
 return {kind:'rx-offline-candidate',trainingSamples:candidate.examples,baseline:old,candidate:next,
  improvesBoth:next.holdout>=old.holdout&&next.challenge>=old.challenge&&(next.holdout>old.holdout||next.challenge>old.challenge),
  productionConnected:false};
}
if(require.main===module)console.log('RX TRAINING CANDIDATE',JSON.stringify(compare()));
module.exports={EXTRAS,compare};
