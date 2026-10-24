'use strict';
// VEXORIO Guard: independently implemented, locally trained multinomial Naive Bayes.
// No third-party model, API, network access or persistent user data.
const VERSION='0.2.0';
function tokens(text){
 if(typeof text!=='string')return [];
 return (text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]{2,}/gu)||[]).slice(0,3000);
}
function train(examples){
 if(!Array.isArray(examples)||examples.length<4)throw Error('At least four labeled examples required');
 const classes=new Map(),vocabulary=new Set();
 for(const row of examples){
  if(!row||typeof row.text!=='string'||!['safe','suspicious'].includes(row.label))throw Error('Invalid training example');
  const words=tokens(row.text);
  if(!words.length)throw Error('Empty training text');
  const entry=classes.get(row.label)||{documents:0,total:0,counts:new Map()};
  entry.documents++;
  for(const word of words){entry.counts.set(word,(entry.counts.get(word)||0)+1);entry.total++;vocabulary.add(word)}
  classes.set(row.label,entry);
 }
 if(classes.size!==2)throw Error('Both classes required');
 const total=examples.length,terms=vocabulary.size;
 return Object.freeze({
  version:VERSION,
  predict(text){
   const words=tokens(text),scores={};
   const recognized=words.filter(word=>vocabulary.has(word)).length;
   const coverage=words.length?recognized/words.length:0;
   for(const [label,entry] of classes){
    let log=Math.log(entry.documents/total);
    for(const word of words)log+=Math.log(((entry.counts.get(word)||0)+1)/(entry.total+terms));
    scores[label]=log;
   }
   const shift=Math.max(...Object.values(scores));
   const safe=Math.exp(scores.safe-shift),suspicious=Math.exp(scores.suspicious-shift);
   const probability=suspicious/(safe+suspicious);
   return {version:VERSION,label:recognized?probability>=0.5?'suspicious':'safe':'unknown',confidence:recognized?Math.max(probability,1-probability):0,probabilitySuspicious:probability,coverage,recognizedTokens:recognized,mode:'advisory',trainedExamples:total};
  }
 });
}
module.exports={VERSION,train,tokens};
