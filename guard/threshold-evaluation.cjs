'use strict';
// Synthetic/offline calibration. Reports review workload and missed suspicious cases;
// never changes production settings or automatically moderates listings.
const {train}=require('./local-model.cjs');
const {checkDataset}=require('./dataset-check.cjs');
function evaluateThresholds(training,testing,{thresholds=[0,0.1,0.25,0.5,0.75],minimumConfidence=0.85}={}){
 if(!Array.isArray(testing)||testing.length<2||testing.some(x=>!x||typeof x.text!=='string'||!x.text.trim()||!['safe','suspicious'].includes(x.label)))throw Error('Invalid test examples');
 if(!Array.isArray(thresholds)||!thresholds.length||thresholds.some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('Invalid thresholds');
 if(!Number.isFinite(minimumConfidence)||minimumConfidence<0.5||minimumConfidence>1)throw Error('Invalid confidence');
 const audit=checkDataset(training,testing);
 if(!audit.clean)throw Error('Near-duplicate training and test examples');
 const model=train(training),predictions=testing.map(x=>({...model.predict(x.text),actual:x.label}));
 return thresholds.map(minimumCoverage=>{
  const result={minimumCoverage,samples:testing.length,reviewCount:0,unknownCount:0,flaggedSuspicious:0,missedSuspicious:0,safeSentToReview:0};
  for(const p of predictions){
   const unknown=p.label==='unknown'||p.coverage<minimumCoverage;
   const flagged=!unknown&&p.label==='suspicious'&&p.confidence>=minimumConfidence;
   const review=unknown||flagged;
   if(unknown)result.unknownCount++;
   if(flagged)result.flaggedSuspicious++;
   if(review)result.reviewCount++;
   if(p.actual==='safe'&&review)result.safeSentToReview++;
   if(p.actual==='suspicious'&&!review)result.missedSuspicious++;
  }
  result.reviewRate=result.reviewCount/result.samples;
  return result;
 });
}
module.exports={evaluateThresholds};
