'use strict';
// Evaluate on held-out labeled examples only; never use training rows as proof of accuracy.
const {train}=require('./local-model.cjs');
const {checkDataset}=require('./dataset-check.cjs');
function evaluateDataset(training,testing){
 if(!Array.isArray(testing)||testing.length<2)throw Error('At least two held-out examples required');
 const seen=new Set(training.map(x=>String(x.text).normalize('NFKC').trim().toLowerCase()));
 const audit=checkDataset(training,testing);
 if(!audit.clean)throw Error('Near-duplicate training and test examples: '+JSON.stringify(audit.overlaps));
 const model=train(training);
 const counts={tp:0,tn:0,fp:0,fn:0};
 const examples=[];
 for(const item of testing){
  if(!item||typeof item.text!=='string'||!['safe','suspicious'].includes(item.label))throw Error('Invalid test example');
  const normalized=item.text.normalize('NFKC').trim().toLowerCase();
  if(!normalized||seen.has(normalized))throw Error('Test set overlaps training set or is empty');
  const result=model.predict(item.text);
  const actual=item.label==='suspicious',predicted=result.label==='suspicious';
  counts[actual?(predicted?'tp':'fn'):(predicted?'fp':'tn')]++;
  examples.push({actual:item.label,predicted:result.label,confidence:result.confidence});
 }
 const {tp,tn,fp,fn}=counts;
 const ratio=(a,b)=>b?a/b:null;
 return {samples:testing.length,counts,accuracy:(tp+tn)/testing.length,precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn),falsePositiveRate:ratio(fp,fp+tn),examples};
}
module.exports={evaluateDataset};
