'use strict';
// RX TEXT EVALUATION — held-out phrases, never used by createLearner() during training.
const {createLearner,LABELS,lexicalProbe}=require('./rx-text-learner.cjs');
const HOLDOUT=Object.freeze([
 ['witaj królowo','greeting'],['hej RX','greeting'],['dobry wieczór','greeting'],
 ['jak poszły testy','tests'],['wynik testowania','tests'],['sprawdzenie testów','tests'],
 ['przypomnij co ustaliliśmy','memory'],['co zapamiętałaś','memory'],['nasza pamięć rozmów','memory'],
 ['ile jest dwa plus dwa','math'],['oblicz mi sumę','math'],['pomnóż liczby','math'],
 ['siema RX','greeting'],['miło cię widzieć','greeting'],['witam serdecznie','greeting'],
 ['czy kontrola przeszła','tests'],['raport z testowania','tests'],['sprawdź zielone wyniki','tests'],
 ['odtwórz nasze ustalenia','memory'],['co było w poprzedniej rozmowie','memory'],['przypomnij historię','memory'],
 ['jaki wynik dodawania','math'],['wylicz iloczyn','math'],['obliczenie procentów','math']
]);

// Additional untouched challenge set: paraphrases, negation, and shared vocabulary.
// Reported separately so the original 24-item benchmark remains comparable.
const CHALLENGE=Object.freeze([
 ['halo, jesteś tutaj','greeting'],['dobrego poranka','greeting'],['pozdrawiam królową','greeting'],
 ['miło znowu rozmawiać','greeting'],['witaj po przerwie','greeting'],['serdecznie cię witam','greeting'],
 ['jak przebiegła kontrola kodu','tests'],['czy sprawdzanie zakończyło się sukcesem','tests'],
 ['podaj stan weryfikacji','tests'],['zobacz błędy z kontroli','tests'],
 ['czy automatyczne kontrole działają','tests'],['pokaż rezultaty sprawdzania','tests'],
 ['co ustalaliśmy wczoraj','memory'],['wróć do poprzednich ustaleń','memory'],
 ['co zachowałaś z rozmowy','memory'],['odszukaj dawne wiadomości','memory'],
 ['przytocz poprzedni plan','memory'],['pamiętasz nasz projekt','memory'],
 ['jaka jest suma trzech i pięciu','math'],['ile wynosi różnica liczb','math'],
 ['podziel dwanaście przez cztery','math'],['wyznacz wynik mnożenia','math'],
 ['oblicz połowę kwoty','math'],['ile otrzymamy po dodaniu','math'],
 // Contrast cases deliberately contain words that also occur in other categories.
 ['witaj, sprawdź testy','tests'],['pamiętasz wynik testowania','memory'],
 ['oblicz ile testów przeszło','math'],['hej, przypomnij ustalenia','memory'],
 ['jaki wynik dodawania pamiętasz','math'],['czy pamiętasz nasze powitanie','memory'],
 ['test pamięci zakończony sukcesem','tests'],['policz wynik kontroli','math']
]);
function evaluateChallenge({epochs=180}={}){
 const learner=createLearner({epochs});
 let neural=0,lexical=0,hybrid=0,matched=0;
 const cases=CHALLENGE.map(([text,expected])=>{
  const predicted=learner.classify(text).label;
  const probe=lexicalProbe(text);
  const combined=probe.matched&&probe.overlap>=0.5?probe.label:predicted;
  if(predicted===expected)neural++;
  if(probe.label===expected)lexical++;
  if(combined===expected)hybrid++;
  if(probe.matched)matched++;
  return {text,expected,neural:predicted,lexical:probe.label,hybrid:combined,overlap:probe.overlap};
 });
 return {kind:'rx-text-challenge-evaluation',sampleCount:cases.length,neural:{correct:neural,accuracy:neural/cases.length},lexical:{correct:lexical,accuracy:lexical/cases.length,matched},hybrid:{correct:hybrid,accuracy:hybrid/cases.length},cases,productionConnected:false};
}

function evaluate({epochs=180}={}){
 const learner=createLearner({epochs});
 const confusion=Object.fromEntries(LABELS.map(label=>[label,Object.fromEntries(LABELS.map(other=>[other,0]))]));
 let correct=0;
 let lexicalCorrect=0,lexicalMatched=0,hybridCorrect=0;
 const cases=HOLDOUT.map(([text,expected])=>{
  const predicted=learner.classify(text).label;
  const lexical=lexicalProbe(text);
  if(lexical.label===expected)lexicalCorrect++;
  if(lexical.matched)lexicalMatched++;
  const hybrid=lexical.matched&&lexical.overlap>=0.5?lexical.label:predicted;
  if(hybrid===expected)hybridCorrect++;
  confusion[expected][predicted]++;
  if(predicted===expected)correct++;
  return {text,expected,predicted,correct:predicted===expected,lexical:lexical.label,lexicalOverlap:lexical.overlap,hybrid};
 });
 return {kind:'rx-text-heldout-evaluation',sampleCount:cases.length,correct,accuracy:correct/cases.length,confusion,lexical:{correct:lexicalCorrect,accuracy:lexicalCorrect/cases.length,matched:lexicalMatched},hybrid:{correct:hybridCorrect,accuracy:hybridCorrect/cases.length,threshold:0.5},cases,training:learner.metrics,productionConnected:false};
}
if(require.main===module)console.log(JSON.stringify({baseline:evaluate(),challenge:evaluateChallenge()},null,2));
module.exports={HOLDOUT,CHALLENGE,evaluate,evaluateChallenge};
