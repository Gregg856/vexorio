'use strict';
// Compare VEXORIO's independent text model against its rule-based baseline.
// Results are diagnostic only: no claims of real-world accuracy from synthetic examples.
const {evaluateDataset}=require('./metrics.cjs');
const {screenListing}=require('./engine.cjs');
function compareModels(training,testing){
 const learned=evaluateDataset(training,testing);
 const counts={tp:0,tn:0,fp:0,fn:0};
 for(const item of testing){
  const actual=item.label==='suspicious';
  const prediction=screenListing({title:'Ogłoszenie',description:item.text});
  const predicted=prediction.score>0||prediction.status==='review';
  counts[actual?(predicted?'tp':'fn'):(predicted?'fp':'tn')]++;
 }
 const {tp,tn,fp,fn}=counts;
 const ratio=(a,b)=>b?a/b:null;
 const baseline={samples:testing.length,counts,accuracy:(tp+tn)/testing.length,precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn),falsePositiveRate:ratio(fp,fp+tn)};
 return {dataset:'synthetic_holdout',learned:{...learned,examples:undefined},rules:baseline,accuracyDifference:learned.accuracy-baseline.accuracy};
}
module.exports={compareModels};
