'use strict';
(()=>{const f=document.getElementById('f'),out=document.getElementById('out');if(!f||!out)return;
const rules=[
 ['credential_request',60,/send\s+(?:your\s+)?(?:password|otp|verification\s+code)|wyślij\s+(?:hasło|kod\s+sms)|passwort\s+(?:senden|schicken)|надішліть\s+(?:пароль|код)/iu],
 ['external_payment',35,/western\s*union|moneygram|gift\s*card|pay\s+outside|płatnoś(?:ć|ci)\s+poza|zahlung\s+(?:außerhalb|ausserhalb)/iu],
 ['advance_fee',35,/advance\s+fee|upfront\s+payment|zaliczk[ęa]\s+(?:najpierw|z\s+góry)|vorkasse\s+(?:nur|zwingend)/iu],
 ['offsite_link',20,/https?:\/\/\S+/iu],
 ['contact_spam',15,/(?:\+?\d[\s.()-]?){12,}/u]
];
f.addEventListener('submit',e=>{e.preventDefault();const title=document.getElementById('t').value.normalize('NFKC').trim(),description=document.getElementById('d').value.normalize('NFKC').trim();if(!title||!description){out.textContent='Uzupełnij tytuł i opis.';return}const text=title+' '+description;let score=0;const signals=[];for(const [name,weight,pattern] of rules){if(pattern.test(text)){score+=weight;signals.push(name)}}if((text.match(/https?:\/\/\S+/giu)||[]).length>2){score+=25;signals.push('multiple_links')}if(/(.)\1{14,}/u.test(text)){score+=15;signals.push('repeated_characters')}score=Math.min(score,100);out.textContent=JSON.stringify({mode:'demo_only',decision:'none',score,status:score>=60?'review':score>0?'caution':'no_text_signals',signals,warning:'Ocena pomocnicza, bez automatycznej moderacji.'},null,2)});
})();