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
 const words=s=>new Set((s.toLocaleLowerCase('pl').match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>w.length>2));
 const query=words(text);
 const ranked=EXAMPLES.map(([phrase,label])=>{
  const candidate=words(phrase);
  let common=0;for(const word of query)if(candidate.has(word))common++;
  const union=query.size+candidate.size-common;
  return {label,overlap:union?common/union:0};
 }).sort((a,b)=>b.overlap-a.overlap);
 return {kind:'rx-lexical-probe',label:ranked[0].label,overlap:ranked[0].overlap,matched:ranked[0].overlap>0};
}
// Fixed unseen prompts: benchmark generalization, not memorization of training phrases.
const HELD_OUT=Object.freeze([
 ['hej królowo','greeting'],['miłego wieczoru','greeting'],
 ['sprawdź testy','tests'],['raport z testów','tests'],
 ['przypomnij historię','memory'],['czy coś pamiętasz','memory'],
 ['policz 5 razy 6','math'],['ile wynosi suma','math']
]);
function evaluateHeldOut(learner){
 if(!learner||typeof learner.classify!=='function')throw Error('Invalid learner');
 const cases=HELD_OUT.map(([text,expected])=>({text,expected,predicted:learner.classify(text).label}));
 const correct=cases.filter(c=>c.expected===c.predicted).length;
 const perLabel=Object.fromEntries(LABELS.map(label=>{
  const subset=cases.filter(c=>c.expected===label);
  const hits=subset.filter(c=>c.predicted===label).length;
  return [label,{correct:hits,total:subset.length,accuracy:subset.length?hits/subset.length:null}];
 }));
 return {kind:'rx-text-held-out-evaluation',correct,total:cases.length,accuracy:correct/cases.length,perLabel,cases};
}
// Experimental corpus-only word continuation. This is a trained word transition model,
// not a neural LLM. It never executes text, accesses users' conversations, or changes chat.
const SAFE_SENTENCES=Object.freeze([
 'Cześć, możemy dziś wspólnie sprawdzić wyniki testów.',
 'Witaj, pomogę Ci uporządkować zadania projektu.',
 'Najpierw sprawdzę dostępne informacje, potem przedstawię wynik.',
 'Nie potwierdzę zakończenia zadania bez sprawdzenia testów.',
 'Pamięć rozmowy pomaga zachować kontekst kolejnych pytań.',
 'Wynik obliczenia należy sprawdzić przed zapisaniem.',
 'Jeżeli pojawi się błąd, sprawdzimy jego przyczynę.',
 'Dobrze jest zapisać postępy przed następnym etapem.'
]);
function createSentenceExperiment({sentences=SAFE_SENTENCES}={}){
 if(!Array.isArray(sentences)||sentences.length<2||sentences.length>100||
    sentences.some(x=>typeof x!=='string'||!x.trim()||x.length>240))throw Error('Invalid training sentences');
 const transitions=new Map();
 const add=(from,to)=>{const next=transitions.get(from)||new Map();next.set(to,(next.get(to)||0)+1);transitions.set(from,next);};
 for(const sentence of sentences){
  const words=sentence.normalize('NFC').split(/\s+/u);
  let previous='<START>';
  for(const word of words){add(previous,word);previous=word;}
  add(previous,'<END>');
 }
 function generate({seed='',maxWords=18}={}){
  if(typeof seed!=='string'||seed.length>80||!Number.isSafeInteger(maxWords)||maxWords<1||maxWords>40)throw Error('Invalid generation request');
  const starts=transitions.get('<START>');
  const matching=[...starts.keys()].filter(w=>w.toLocaleLowerCase('pl').startsWith(seed.toLocaleLowerCase('pl')));
  const first=matching[0]||[...starts.keys()][0];
  let word=first;const output=[];
  for(let i=0;i<maxWords&&word!=='<END>';i++){
   output.push(word);
   const options=transitions.get(word);
   if(!options)break;
   word=[...options].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pl'))[0][0];
  }
  return {text:output.join(' '),kind:'rx-experimental-word-continuation',trainedSentences:sentences.length,productionConnected:false};
 }
 // Reject unseen topics instead of silently returning the first memorized sentence.
 function generateRelevant({prompt='',maxWords=18}={}){
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>160)throw Error('Invalid topic prompt');
  const tokens=text=>text.toLocaleLowerCase('pl').match(/[\p{L}\p{N}]+/gu)||[];
  const stop=new Set(['jest','oraz','przed','potem','możemy','dzisiaj','dzis','jak','czy','dla','się','sie','ten','tego','tym','który','która','ktore','proszę','prosze','chcę','chce']);
  const query=[...new Set(tokens(prompt).filter(w=>w.length>3&&!stop.has(w)))];
  const ranked=sentences.map((sentence,index)=>{
   const words=new Set(tokens(sentence));
   const hits=query.filter(w=>words.has(w));
   return {index,hits:hits.length};
  }).sort((a,b)=>b.hits-a.hits||a.index-b.index);
  if(!query.length||ranked[0].hits===0)return {kind:'rx-topic-gated-continuation',matched:false,text:null,reason:'unseen-topic',productionConnected:false};
  const selected=sentences[ranked[0].index];
  const first=selected.split(/\s+/u)[0];
  const generated=generate({seed:first,maxWords});
  return {kind:'rx-topic-gated-continuation',matched:true,text:generated.text,matchedTrainingIndex:ranked[0].index,reason:'lexical-overlap-only',productionConnected:false};
 }
 return {kind:'rx-experimental-sentence-model',trainedSentences:sentences.length,generate,generateRelevant};
}
// Evaluate memorization and structural completeness before claiming language quality.
function evaluateSentenceExperiment(model,{sentences=SAFE_SENTENCES}={}){
 if(!model||typeof model.generate!=='function'||!Array.isArray(sentences)||!sentences.length||
    sentences.some(s=>typeof s!=='string'||!s.trim()))throw Error('Invalid sentence evaluation');
 const normalize=s=>s.normalize('NFC').trim().replace(/\\s+/gu,' ');
 const corpus=new Set(sentences.map(normalize));
 const prompts=[...new Set(sentences.map(s=>s.trim().split(/\\s+/u)[0]))];
 const cases=prompts.map(seed=>{
  const output=model.generate({seed,maxWords:40});
  if(!output||typeof output.text!=='string')throw Error('Invalid generated text');
  const text=normalize(output.text);
  return {seed,text,wordCount:text?text.split(/\\s+/u).length:0,exactTrainingCopy:corpus.has(text),
   endsWithPunctuation:/[.!?]$/u.test(text)};
 });
 const count=cases.length;
 const copies=cases.filter(x=>x.exactTrainingCopy).length;
 const complete=cases.filter(x=>x.endsWithPunctuation).length;
 const distinct=new Set(cases.map(x=>x.text)).size;
 return {kind:'rx-sentence-quality-evaluation',total:count,exactTrainingCopies:copies,
  exactCopyRate:copies/count,completeSentences:complete,completeRate:complete/count,
  distinctOutputs:distinct,distinctRate:distinct/count,productionConnected:false,cases};
}
module.exports={createLearner,vector,LABELS,lexicalProbe,evaluateHeldOut,HELD_OUT,createSentenceExperiment,SAFE_SENTENCES,evaluateSentenceExperiment};
