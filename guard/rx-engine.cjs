'use strict';
// RX Strazak 1.0: explainable, offline, advisory fusion of rules and a trained local model.
// Never auto-publishes, rejects, or changes user content.
const {screenListing}=require('./engine.cjs');
const VERSION='1.0.0';
function evaluateRX(listing,{model=null,minCoverage=0.2,minConfidence=0.75}={}){
 const rules=screenListing(listing);
 const flags=[...rules.signals];
 let prediction=null,modelStatus='not_configured';
 if(model!==null){
  if(typeof model.predict!=='function')modelStatus='invalid_model';
  else try{
   const result=model.predict(String(listing?.title||'')+' '+String(listing?.description||''));
   const valid=result&&['safe','suspicious','unknown'].includes(result.label)
    &&Number.isFinite(result.confidence)&&result.confidence>=0&&result.confidence<=1
    &&Number.isFinite(result.coverage)&&result.coverage>=0&&result.coverage<=1;
   if(!valid)modelStatus='invalid_response';
   else{
    prediction={label:result.label,confidence:result.confidence,coverage:result.coverage};
    modelStatus=result.label==='unknown'||result.coverage<minCoverage||result.confidence<minConfidence?'uncertain':'usable';
   }
  }catch(_){modelStatus='unavailable';}
 }
 const modelSuspicious=modelStatus==='usable'&&prediction.label==='suspicious';
 const disagreement=modelStatus==='usable'&&prediction.label==='safe'&&rules.score>=60;
 if(modelSuspicious)flags.push('rx_model_suspicious');
 if(disagreement)flags.push('rx_disagreement');
 if(modelStatus==='uncertain')flags.push('rx_model_uncertain');
 const requiresHumanReview=rules.status==='review'||modelSuspicious||disagreement||rules.status==='caution'
  ||rules.signals.includes('invalid_input')||rules.signals.includes('invalid_content');
 const priority=rules.status==='review'||modelSuspicious?'high':requiresHumanReview?'medium':'none';
 return Object.freeze({version:VERSION,name:'RX Strażak',mode:'advisory',decision:'none',
  priority,requiresHumanReview,ruleScore:rules.score,ruleStatus:rules.status,
  modelStatus,prediction,flags:[...new Set(flags)],
  explanation:disagreement?'Reguły i model są sprzeczne; wymagana kontrola człowieka.':
   modelSuspicious?'Model wskazał ryzyko przy wystarczającym pokryciu i pewności.':
   rules.status==='review'?'Reguły wykryły silne sygnały ryzyka.':
   rules.status==='caution'?'Reguły wykryły sygnały wymagające ostrożności.':
   'Brak silnych sygnałów w użytych regułach; nie oznacza to bezpieczeństwa.'});
}
module.exports={VERSION,evaluateRX};
