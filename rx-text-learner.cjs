'use strict';
// RX TEXT LEARNER — small, reproducible intent classifier using RX's own tokenizer and neural core.
// Offline demonstration only: not a generative language model and not connected to production chat.
const {toFrequencyVector}=require('./rx-language-tokenizer.cjs');
const {createNetwork,train,forward}=require('./rx-neural-core.cjs');
const EXAMPLES=[
 ['cześć królowo','greeting'],['dzień dobry RX','greeting'],['hej witaj','greeting'],
 ['pokaż testy','tests'],['sprawdź wyniki testów','tests'],['czy testy są zielone','tests'],
 ['co pamiętasz','memory'],['przypomnij nasze ustalenia','memory'],['pamiętasz rozmowę','memory'],
 ['policz 2 plus 3','math'],['oblicz wynik','math'],['ile to 7 razy 8','math'],
 // Additional training examples, distinct from the held-out evaluation set.
 ['witaj przyjacielu','greeting'],['serdeczne pozdrowienia','greeting'],['miłego dnia','greeting'],
 ['pokaż raport kontroli','tests'],['uruchom sprawdzanie','tests'],['jaki status testu','tests'],
 ['zachowaj w pamięci','memory'],['przywołaj wspomnienia','memory'],['historia naszych wiadomości','memory'],
 ['dodaj dwie liczby','math'],['wykonaj mnożenie','math'],['policz procent','math']
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

// RX lexical-neighbor probe: independent of neural scores, never overrides classify().
// Uses only training examples, so held-out evaluation remains unseen.
function lexicalProbe(text){
 if(typeof text!=='string'||!text.trim())throw Error('Invalid text');
 const words=s=>new Set((s.toLocaleLowerCase('pl').match(/[\\p{L}\\p{N}]+/gu)||[]).filter(w=>w.length>2));
 const query=words(text);
 const ranked=EXAMPLES.map(([phrase,label])=>{
  const candidate=words(phrase);
  let common=0;for(const word of query)if(candidate.has(word))common++;
  const union=query.size+candidate.size-common;
  return {label,overlap:union?common/union:0};
 }).sort((a,b)=>b.overlap-a.overlap);
 return {kind:'rx-lexical-probe',label:ranked[0].label,overlap:ranked[0].overlap,matched:ranked[0].overlap>0};
}
module.exports={createLearner,vector,LABELS,lexicalProbe};
