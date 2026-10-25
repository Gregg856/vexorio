'use strict';
// Browser build of the existing RX engine; local only, no external calls.
(()=>{
 const modules={};
 function load(name,source){const module={exports:{}};source(module,module.exports,id=>{if(id==='./engine.cjs')return modules.engine;if(id==='./local-model.cjs')return modules.local;throw Error('Unknown module');});return module.exports;}
 modules.engine=load('engine',function(module,exports,require){
'use strict';
// VEXORIO Guard 1.0 — offline, deterministic screening. Advisory only.
// Never use this module as the sole basis for rejecting or publishing listings.
// No personal data is stored or sent to external services.
const VERSION='1.0.0';
const MAX_TEXT=12000;
const RULES=Object.freeze([
 {id:'external_payment',weight:35,pattern:/\b(?:pay\s*(?:outside|directly)|western\s*union|moneygram|gift\s*card|zahlung\s*(?:außerhalb|ausserhalb)|płatnoś(?:ć|ci)\s*poza|оплата\s*поза)\b/iu},
 {id:'advance_fee',weight:35,pattern:/\b(?:advance\s*fee|upfront\s*payment|vorkasse\s*(?:nur|zwingend)|zaliczk[ęa]\s*(?:najpierw|z\s*góry)|передоплат[ау]\s*(?:обов'язкова|спочатку))\b/iu},
 {id:'credential_request',weight:60,pattern:/\b(?:send\s*(?:your\s*)?(?:password|otp|verification\s*code)|passwort\s*(?:senden|schicken)|wyślij\s*(?:(?:mi\s+)?(?:swoje\s+|twoje\s+)?hasło|(?:mi\s+)?kod\s*sms)|надішліть\s*(?:пароль|код\s*підтвердження))\b/iu},
 {id:'guaranteed_profit',weight:35,pattern:/(?:gwarantowan(?:y|e|a)\s+zysk|zarobisz\s+\d+[\s.,]*\d*\s*(?:zł|pln|eur|€)\s+dziennie|guaranteed\s+(?:profit|returns)|garantiert(?:er|e)?\s+gewinn|гарантован(?:ий|і)\s+прибуток)/iu},
 {id:'pressure_tactic',weight:20,pattern:/(?:tylko\s+dziś\s+wpłać|wpłać\s+natychmiast|pay\s+immediately|sofort\s+bezahlen|сплатіть\s+негайно)/iu},
 {id:'offsite_link',weight:20,pattern:/https?:\/\/[^\s]+/iu},
 {id:'contact_spam',weight:15,pattern:/(?:\+?\d[\s.()-]?){12,}/u}
]);
function normalize(value){return typeof value==='string'?value.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').trim():'';}
function screenListing(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return {version:VERSION,status:'review',score:0,signals:['invalid_input']};
 const title=normalize(input.title),description=normalize(input.description);
 if(!title||!description||title.length>240||description.length>MAX_TEXT)return {version:VERSION,status:'review',score:0,signals:['invalid_content']};
 const text=title+' '+description;
 const signals=[];let score=0;
 for(const rule of RULES)if(rule.pattern.test(text)){signals.push(rule.id);score+=rule.weight;}
 const urls=text.match(/https?:\/\/[^\s]+/giu)||[];
 if(urls.length>2){signals.push('multiple_links');score+=25;}
 if(/(.)\1{14,}/u.test(text)){signals.push('repeated_characters');score+=15;}
 if(/\b(\S+)(?:\s+\1){7,}\b/iu.test(text)){signals.push('repeated_words');score+=15;}
 return {version:VERSION,status:score>=60?'review':score>0?'caution':'no_text_signals',score:Math.min(100,score),signals};
}
module.exports={VERSION,screenListing};

});
 modules.local=load('local',function(module,exports,require){
'use strict';
// VEXORIO Guard: independently implemented, locally trained multinomial Naive Bayes.
// No third-party model, API, network access or persistent user data.
const VERSION='0.2.0';
function tokens(text){
 if(typeof text!=='string')return [];
 return (text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]{2,}/gu)||[]).slice(0,3000);
}
function train(examples){
 if(!Array.isArray(examples)||examples.length<4)throw Error('At least four labeled examples required');
 const classes=new Map(),vocabulary=new Set();
 for(const row of examples){
  if(!row||typeof row.text!=='string'||!['safe','suspicious'].includes(row.label))throw Error('Invalid training example');
  const words=tokens(row.text);
  if(!words.length)throw Error('Empty training text');
  const entry=classes.get(row.label)||{documents:0,total:0,counts:new Map()};
  entry.documents++;
  for(const word of words){entry.counts.set(word,(entry.counts.get(word)||0)+1);entry.total++;vocabulary.add(word)}
  classes.set(row.label,entry);
 }
 if(classes.size!==2)throw Error('Both classes required');
 const total=examples.length,terms=vocabulary.size;
 return Object.freeze({
  version:VERSION,
  predict(text){
   const words=tokens(text),scores={};
   const recognized=words.filter(word=>vocabulary.has(word)).length;
   const coverage=words.length?recognized/words.length:0;
   for(const [label,entry] of classes){
    let log=Math.log(entry.documents/total);
    for(const word of words)log+=Math.log(((entry.counts.get(word)||0)+1)/(entry.total+terms));
    scores[label]=log;
   }
   const shift=Math.max(...Object.values(scores));
   const safe=Math.exp(scores.safe-shift),suspicious=Math.exp(scores.suspicious-shift);
   const probability=suspicious/(safe+suspicious);
   return {version:VERSION,label:recognized?probability>=0.5?'suspicious':'safe':'unknown',confidence:recognized?Math.max(probability,1-probability):0,probabilitySuspicious:probability,coverage,recognizedTokens:recognized,mode:'advisory',trainedExamples:total};
  }
 });
}
module.exports={VERSION,train,tokens};

});
 modules.rx=load('rx',function(module,exports,require){
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

});
 const examples=[
  {label:'safe',text:'Sprzedam rower miejski odbiór osobisty'},
  {label:'safe',text:'Fahrrad gebraucht Abholung möglich'},
  {label:'safe',text:'Used bicycle good condition local pickup'},
  {label:'safe',text:'Продам велосипед самовивіз хороший стан'},
  {label:'suspicious',text:'Wyślij hasło kod SMS płatność western union'},
  {label:'suspicious',text:'Guaranteed profit pay immediately gift card'},
  {label:'suspicious',text:'Gwarantowany zysk wpłać natychmiast inwestycja'},
  {label:'suspicious',text:'Send password verification code pay outside'}
 ];
 const model=modules.local.train(examples);
 const form=document.getElementById('guardRxForm');
 const output=document.getElementById('guardRxResult');
 if(form&&output)form.addEventListener('submit',event=>{
  event.preventDefault();
  const title=document.getElementById('guardRxTitle').value;
  const description=document.getElementById('guardRxDescription').value;
  const result=modules.rx.evaluateRX({title,description},{model});
  const p=result.prediction;
  output.textContent='RX STRAŻAK 1.0 — ANALIZA LOKALNA\\nPriorytet: '+result.priority+'\\nReguły: '+result.ruleScore+'/100 ('+result.ruleStatus+')\\nModel: '+result.modelStatus+(p?' | '+p.label+' | pewność '+Math.round(p.confidence*100)+'% | pokrycie '+Math.round(p.coverage*100)+'%':'')+'\\nSygnały: '+(result.flags.join(', ')||'brak')+'\\n\\n'+result.explanation+'\\n\\nModel demonstracyjny uczony na 8 przykładach; wyniki nie są zweryfikowaną oceną bezpieczeństwa. Bez wysyłania danych i bez automatycznych decyzji.'.replaceAll('\\n','\n');
 });
})();
