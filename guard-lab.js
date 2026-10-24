'use strict';
(()=>{const f=document.getElementById('f'),out=document.getElementById('out');if(!f||!out)return;
const rules=[
 ['credential_request',60,/send\s+(?:your\s+)?(?:password|otp|verification\s+code)|wyślij\s+(?:(?:mi\s+)?(?:swoje\s+|twoje\s+)?hasło|(?:mi\s+)?kod\s+sms)|passwort\s+(?:senden|schicken)|надішліть\s+(?:пароль|код)/iu],
 ['external_payment',35,/western\s*union|moneygram|gift\s*card|pay\s+outside|płatnoś(?:ć|ci)\s+poza|zahlung\s+(?:außerhalb|ausserhalb)/iu],
 ['advance_fee',35,/advance\s+fee|upfront\s+payment|zaliczk[ęa]\s+(?:najpierw|z\s+góry)|vorkasse\s+(?:nur|zwingend)/iu],
 ['guaranteed_profit',35,/(?:gwarantowan(?:y|e|a)\s+zysk|zarobisz\s+\d+[\s.,]*\d*\s*(?:zł|pln|eur|€)\s+dziennie|guaranteed\s+(?:profit|returns)|garantiert(?:er|e)?\s+gewinn|гарантован(?:ий|і)\s+прибуток)/iu],
 ['pressure_tactic',20,/(?:tylko\s+dziś\s+wpłać|wpłać\s+natychmiast|pay\s+immediately|sofort\s+bezahlen|сплатіть\s+негайно)/iu],
 ['offsite_link',20,/https?:\/\/\S+/iu],
 ['contact_spam',15,/(?:\+?\d[\s.()-]?){12,}/u]
];
f.addEventListener('submit',e=>{e.preventDefault();const title=document.getElementById('t').value.normalize('NFKC').trim(),description=document.getElementById('d').value.normalize('NFKC').trim();if(!title||!description){out.textContent='Uzupełnij tytuł i opis.';return}const text=title+' '+description;let score=0;const signals=[];for(const [name,weight,pattern] of rules){if(pattern.test(text)){score+=weight;signals.push(name)}}if((text.match(/https?:\/\/\S+/giu)||[]).length>2){score+=25;signals.push('multiple_links')}if(/(.)\1{14,}/u.test(text)){score+=15;signals.push('repeated_characters')}if(/\b(\S+)(?:\s+\1){7,}\b/iu.test(text)){score+=15;signals.push('repeated_words')}score=Math.min(score,100);const names={credential_request:'Prośba o hasło lub kod weryfikacyjny',external_payment:'Podejrzana forma płatności poza portalem',advance_fee:'Żądanie przedpłaty',offsite_link:'Link do zewnętrznej strony',contact_spam:'Podejrzanie długi ciąg cyfr',guaranteed_profit:'Podejrzana obietnica gwarantowanego zysku',pressure_tactic:'Presja na natychmiastową wpłatę',multiple_links:'Wiele linków zewnętrznych',repeated_characters:'Nietypowe powtarzanie znaków',repeated_words:'Wielokrotnie powtórzone słowa'};
const status=score>=60?'DO KONTROLI MODERATORA':score>0?'ZACHOWAJ OSTROŻNOŚĆ':'NIE WYKRYTO SYGNAŁÓW W TEKŚCIE';
out.textContent='WYNIK: '+score+'/100\n'+status+'\n\n'+(signals.length?'Wykryte sygnały:\n'+signals.map(s=>'• '+(names[s]||s)).join('\n'):'Brak wykrytych sygnałów w analizowanym tekście.')+'\n\nTo wynik pomocniczy. Brak sygnałów nie oznacza, że ogłoszenie jest bezpieczne. Guard nie zatwierdza ani nie usuwa ogłoszeń.'});
})();