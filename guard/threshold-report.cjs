'use strict';
// Offline, advisory-only report. No production setting changes.
const {evaluateThresholds}=require('./threshold-evaluation.cjs');
function buildThresholdReport(training,testing,options={}){
 const rows=evaluateThresholds(training,testing,options);
 const lowestMisses=Math.min(...rows.map(x=>x.missedSuspicious));
 const safest=rows.filter(x=>x.missedSuspicious===lowestMisses);
 const fewestReviews=Math.min(...safest.map(x=>x.reviewCount));
 const candidates=safest.filter(x=>x.reviewCount===fewestReviews);
 const recommended=candidates.reduce((a,b)=>a.minimumCoverage<=b.minimumCoverage?a:b);
 return {
  status:'experimental_synthetic_only',
  automaticConfiguration:false,
  selectionRule:'fewest missed suspicious cases; then fewest reviews; then lowest coverage threshold',
  suggestedCoverageForFurtherTesting:recommended.minimumCoverage,
  caveat:'Not a production recommendation. Validate on representative, consented, separately labeled data before any change.',
  results:rows
 };
}
module.exports={buildThresholdReport};
