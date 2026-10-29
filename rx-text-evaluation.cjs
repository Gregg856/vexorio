'use strict';
// RX TEXT EVALUATION — held-out phrases, never used by createLearner() during training.
const {createLearner,LABELS}=require('./rx-text-learner.cjs');
const HOLDOUT=Object.freeze([
 ['witaj królowo','greeting'],['hej RX','greeting'],['dobry wieczór','greeting'],
 ['jak poszły testy','tests'],['wynik testowania','tests'],['sprawdzenie testów','tests'],
 ['przypomnij co ustaliliśmy','memory'],['co zapamiętałaś','memory'],['nasza pamięć rozmów','memory'],
 ['ile jest dwa plus dwa','math'],['oblicz mi sumę','math'],['pomnóż liczby','math']
]);
function evaluate({epochs=180}={}){
 const learner=createLearner({epochs});
 const confusion=Object.fromEntries(LABELS.map(label=>[label,Object.fromEntries(LABELS.map(other=>[other,0]))]));
 let correct=0;
 const cases=HOLDOUT.map(([text,expected])=>{
  const predicted=learner.classify(text).label;
  confusion[expected][predicted]++;
  if(predicted===expected)correct++;
  return {text,expected,predicted,correct:predicted===expected};
 });
 return {kind:'rx-text-heldout-evaluation',sampleCount:cases.length,correct,accuracy:correct/cases.length,confusion,cases,training:learner.metrics,productionConnected:false};
}
if(require.main===module)console.log(JSON.stringify(evaluate(),null,2));
module.exports={HOLDOUT,evaluate};
