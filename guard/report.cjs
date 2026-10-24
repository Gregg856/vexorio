'use strict';
// Offline, explainable aggregation. No storage, network, or autonomous actions.
const {evaluateListing}=require('./evaluate.cjs');
const {analyzeFraudHints}=require('./fraud-explain.cjs');
const VERSION='0.1.0';
function evaluateGuardReport(listing,options={}){
 const base=evaluateListing(listing,options);
 const fraud=analyzeFraudHints(listing);
 const signals=[...new Set([...base.flags,...fraud.indicators.map(x=>x.id)])];
 const needsReview=base.requiresHumanReview||fraud.requiresHumanReview;
 const reasons=fraud.indicators.map(({id,severity})=>({id,severity,source:'fraud_rules'}));
 if(base.duplicates.length)reasons.push({id:'possible_duplicate',severity:'medium',source:'similarity'});
 if(base.images.some(x=>x.status!=='ok'))reasons.push({id:'image_requires_review',severity:'medium',source:'image'});
 return Object.freeze({
  version:VERSION,mode:'advisory',decision:'none',automaticAction:false,
  requiresHumanReview:needsReview,reviewPriority:fraud.score>=60?'high':needsReview?'normal':'none',
  signals,explanations:reasons,fraud,base
 });
}
module.exports={VERSION,evaluateGuardReport};
