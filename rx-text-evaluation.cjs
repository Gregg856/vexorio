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
if(require.main===module)console.log(JSON.stringify(evaluate(),null,2));
module.exports={HOLDOUT,evaluate};
