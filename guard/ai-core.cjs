'use strict';
// Strażak AI Core 0.1: original trainable bag-of-words intent classifier.
// Pure JS, no API, no pretrained weights, no personal data.
const LABELS=['guardian','developer','studio','general'];
function tokenize(text){return String(text).toLocaleLowerCase('pl').match(/[\p{L}\p{N}]+/gu)||[];}
function train(examples,{epochs=120,rate=0.2}={}){
 if(!Array.isArray(examples)||examples.length<4||!Number.isInteger(epochs)||epochs<1||epochs>1000||!(rate>0&&rate<=1))throw Error('Invalid training input');
 const vocab=[...new Set(examples.flatMap(x=>tokenize(x.text)))].sort();
 if(vocab.length>10000)throw Error('Vocabulary too large');
 const weights=LABELS.map(()=>Array(vocab.length+1).fill(0));
 const index=new Map(vocab.map((x,i)=>[x,i]));
 function vector(text){const x=Array(vocab.length+1).fill(0);x[0]=1;for(const word of new Set(tokenize(text)))if(index.has(word))x[index.get(word)+1]=1;return x;}
 for(let epoch=0;epoch<epochs;epoch++)for(const example of examples){
  if(typeof example.text!=='string'||example.text.length>1000||!LABELS.includes(example.label))throw Error('Invalid example');
  const x=vector(example.text),scores=weights.map(w=>w.reduce((s,v,i)=>s+v*x[i],0));
  const guess=scores.indexOf(Math.max(...scores)),target=LABELS.indexOf(example.label);
  if(guess!==target)for(let i=0;i<x.length;i++){weights[target][i]+=rate*x[i];weights[guess][i]-=rate*x[i];}
 }
 return {version:'0.1',labels:[...LABELS],vocab,weights};
}
function predict(model,text){
 if(!model||model.version!=='0.1'||!Array.isArray(model.vocab)||!Array.isArray(model.weights)||typeof text!=='string'||text.length>2000)throw Error('Invalid prediction input');
 const words=new Set(tokenize(text));
 const scores=model.weights.map(w=>w[0]+model.vocab.reduce((sum,word,i)=>sum+(words.has(word)?w[i+1]:0),0));
 const max=Math.max(...scores),exps=scores.map(s=>Math.exp(Math.max(-60,s-max))),total=exps.reduce((a,b)=>a+b,0);
 const probabilities=exps.map(x=>x/total),best=probabilities.indexOf(Math.max(...probabilities));
 return {label:model.labels[best],confidence:Number(probabilities[best].toFixed(4)),needsReview:probabilities[best]<0.65};
}
module.exports={train,predict,LABELS};
