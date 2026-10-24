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
