// VEXORIO moderation triage: advisory, deterministic text signals.
// No automatic account bans, rejection or publishing decisions.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VexorioModerationTriage=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const rules=[
 {id:'sexual-services',weight:65,terms:[/\b(?:usługi seksualne|sex za pieniądze|seks za pieniądze|escort service|sexual services|sexarbeit)\b/i]},
 {id:'explicit-content',weight:55,terms:[/\b(?:pornografia|pornographic|pornografie|materiały porno)\b/i]},
 {id:'credential-request',weight:50,terms:[/\b(?:podaj hasło|wyślij hasło|send your password|passwort senden)\b/i]},
 {id:'advance-payment',weight:30,terms:[/\b(?:zaliczka przed oględzinami|opłata z góry przed obejrzeniem|pay before viewing)\b/i]},
 {id:'off-platform-contact',weight:15,terms:[/\b(?:pisz tylko na telegram|contact only on telegram|nur telegram)\b/i]}
];
function evaluate(input){
 const title=String(input&&input.title||'').slice(0,300);
 const description=String(input&&input.description||'').slice(0,12000);
 const content=(title+' '+description).normalize('NFKC');
 const reasons=rules.filter(rule=>rule.terms.some(pattern=>pattern.test(content))).map(rule=>({id:rule.id,weight:rule.weight}));
 const score=Math.min(100,reasons.reduce((sum,reason)=>sum+reason.weight,0));
 return {score,level:score>=60?'review-high':score>=25?'review':'low',reasons:reasons.map(({id})=>id),requiresHumanReview:score>=25,photoReviewRequired:!!(input&&input.hasImages),version:1};
}
return Object.freeze({evaluate});
});
