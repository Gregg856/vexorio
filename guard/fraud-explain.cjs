'use strict';
// Explainable multilingual fraud hints; advisory-only, no user data retention.
// Each indicator is evidence to review, not proof of wrongdoing.
const INDICATORS=Object.freeze([
 {id:'credential_phishing',severity:'high',weight:60,patterns:[/\b(?:send|share)\s+(?:me\s+)?(?:your\s+)?(?:otp|password|verification\s+code)\b/iu,/\b(?:wyślij|podaj|prześlij)\s+(?:mi\s+)?(?:hasło|kod\s*(?:sms|weryfikacyjny))\b/iu,/\b(?:sende|schick)\s+(?:mir\s+)?(?:dein\s+)?(?:passwort|bestätigungscode)\b/iu,/(?:надішліть|скиньте|повідомте)\s+(?:мені\s+)?(?:пароль|код\s+підтвердження)/iu]},
 {id:'external_transfer',severity:'medium',weight:30,patterns:[/\b(?:western\s*union|moneygram|gift\s*card)\b/iu,/\b(?:płatność|zapłać)\s+poza\s+(?:portalem|platformą)/iu,/\bpay\s+outside\s+(?:the\s+)?platform\b/iu,/\bzahlung\s+außerhalb\s+der\s+plattform\b/iu,/оплат[аи]\s+поза\s+платформою/iu]},
 {id:'guaranteed_returns',severity:'medium',weight:35,patterns:[/gwarantowan(?:y|e|a)\s+zysk/iu,/guaranteed\s+(?:profit|returns)/iu,/garantiert(?:er|e)?\s+gewinn/iu,/гарантован(?:ий|і)\s+прибуток/iu]}
]);
function analyzeFraudHints(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return {status:'needs_review',reason:'invalid_input',score:0,indicators:[],requiresHumanReview:true,automaticAction:false};
 const title=typeof input.title==='string'?input.title:'',description=typeof input.description==='string'?input.description:'';
 if(!title.trim()||!description.trim()||title.length>240||description.length>12000)return {status:'needs_review',reason:'invalid_content',score:0,indicators:[],requiresHumanReview:true,automaticAction:false};
 const text=(title+' '+description).normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'');
 const indicators=INDICATORS.filter(item=>item.patterns.some(p=>p.test(text))).map(({id,severity,weight})=>({id,severity,weight}));
 const score=Math.min(100,indicators.reduce((sum,x)=>sum+x.weight,0));
 return {status:score>=60?'review_priority':score>0?'caution':'no_rule_match',score,indicators,requiresHumanReview:score>0,automaticAction:false};
}
module.exports={analyzeFraudHints,INDICATORS};
