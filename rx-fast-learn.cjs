'use strict';
// RX FAST LEARN: bounded supervised intent training; not a generative language model.
const {createNetwork,train,forward}=require('./rx-neural-core.cjs');
const {toFrequencyVector}=require('./rx-language-tokenizer.cjs');
const LABELS=Object.freeze(['greeting','math','knowledge','translation']);
const EXAMPLES=Object.freeze([
 ['cześć','greeting'],['hej','greeting'],['witaj','greeting'],['dzień dobry','greeting'],
 ['policz 5 plus 4','math'],['oblicz 7 razy 8','math'],['ile to 3 plus 2','math'],['oblicz 12 minus 4','math'],
 ['co to jest atom','knowledge'],['czym jest fotosynteza','knowledge'],['kim jest Kopernik','knowledge'],['gdzie leży Berlin','knowledge'],
 ['przetłumacz słowo','translation'],['translate pl to de','translation'],['tłumaczenie na niemiecki','translation'],['przetlumacz na angielski','translation']
]);
function vector(text){if(typeof text!=='string'||!text.trim()||text.length>160)throw Error('Invalid text');return toFrequencyVector(text.toLocaleLowerCase('pl-PL'));}
function fit({epochs=180}={}){
 if(!Number.isSafeInteger(epochs)||epochs<1||epochs>1000)throw Error('Invalid epochs');
 const net=createNetwork(256,32,LABELS.length);
 const x=new Float32Array(EXAMPLES.length*256),y=new Float32Array(EXAMPLES.length*LABELS.length);
 EXAMPLES.forEach(([sentence,label],i)=>{x.set(vector(sentence),i*256);y[i*LABELS.length+LABELS.indexOf(label)]=1;});
 const metrics=train(net,x,y,{epochs,rate:0.08});
 return {net,metrics,trainingCount:EXAMPLES.length};
}
function classify(net,text){
 const scores=Array.from(forward(net,vector(text)).pred);
 const index=scores.indexOf(Math.max(...scores));
 return {intent:LABELS[index],score:scores[index]};
}
module.exports={EXAMPLES,LABELS,fit,classify,vector};
