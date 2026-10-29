'use strict';
// RX TEXT LEARNER — small, reproducible intent classifier using RX's own tokenizer and neural core.
// Offline demonstration only: not a generative language model and not connected to production chat.
const {toFrequencyVector}=require('./rx-language-tokenizer.cjs');
const {createNetwork,train,forward}=require('./rx-neural-core.cjs');
const EXAMPLES=[
 ['cześć królowo','greeting'],['dzień dobry RX','greeting'],['hej witaj','greeting'],
 ['pokaż testy','tests'],['sprawdź wyniki testów','tests'],['czy testy są zielone','tests'],
 ['co pamiętasz','memory'],['przypomnij nasze ustalenia','memory'],['pamiętasz rozmowę','memory'],
 ['policz 2 plus 3','math'],['oblicz wynik','math'],['ile to 7 razy 8','math']
];
const LABELS=Object.freeze(['greeting','tests','memory','math']);
function vector(text){
 if(typeof text!=='string'||!text.trim())throw Error('Invalid text');
 return toFrequencyVector(text.toLocaleLowerCase('pl'));
}
function createLearner({epochs=180,hidden=24,rate=0.06}={}){
 if(!Number.isSafeInteger(epochs)||epochs<1||epochs>1000||!Number.isSafeInteger(hidden)||hidden<1||hidden>128||!Number.isFinite(rate)||rate<=0||rate>0.2)throw Error('Invalid training settings');
 const net=createNetwork(256,hidden,LABELS.length);
 const x=new Float32Array(EXAMPLES.length*256),y=new Float32Array(EXAMPLES.length*LABELS.length);
 EXAMPLES.forEach(([phrase,label],i)=>{x.set(vector(phrase),i*256);y[i*LABELS.length+LABELS.indexOf(label)]=1;});
 const metrics=train(net,x,y,{epochs,rate});
 function classify(text){
  const scores=Array.from(forward(net,vector(text)).pred);
  const best=scores.indexOf(Math.max(...scores));
  return {label:LABELS[best],scores,kind:'rx-text-intent',model:'local-neural-classifier'};
 }
 return {kind:'rx-text-learner',metrics,labels:LABELS,classify,examples:EXAMPLES.length};
}
module.exports={createLearner,vector,LABELS};
