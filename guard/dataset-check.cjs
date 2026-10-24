'use strict';
// Detect training/test leakage from reworded or near-identical examples.
// Independent implementation; no external libraries, APIs or user data.
function words(text){
 return new Set((String(text||'').normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]{2,}/gu)||[]));
}
function similarity(a,b){
 const x=words(a),y=words(b);
 if(!x.size&&!y.size)return 1;
 let shared=0;
 for(const word of x)if(y.has(word))shared++;
 return shared/(x.size+y.size-shared);
}
function checkDataset(training,testing,{threshold=0.85}={}){
 if(!Array.isArray(training)||!Array.isArray(testing))throw Error('Invalid dataset');
 if(!Number.isFinite(threshold)||threshold<=0||threshold>1)throw Error('Invalid threshold');
 const overlaps=[];
 for(let i=0;i<testing.length;i++){
  for(let j=0;j<training.length;j++){
   const value=similarity(testing[i]?.text,training[j]?.text);
   if(value>=threshold)overlaps.push({testIndex:i,trainIndex:j,similarity:value});
  }
 }
 return {trainCount:training.length,testCount:testing.length,threshold,overlaps,clean:overlaps.length===0};
}
module.exports={words,similarity,checkDataset};
