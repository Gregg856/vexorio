'use strict';
// Strażak Code Fix 1.0: suggestions only; never executes or edits supplied code.
(function(root){
 const FIXES={
  eval:{title:'Usuń eval',advice:'Zastąp eval jawnym parserem danych (np. JSON.parse dla JSON) lub bezpieczną logiką. Nie wykonuj tekstu jako JavaScript.'},
  'function-constructor':{title:'Usuń dynamiczny Function',advice:'Użyj jawnie zdefiniowanych funkcji zamiast tworzyć kod z tekstu.'},
  'inner-html':{title:'Bezpiecznie wstaw tekst',advice:'Jeśli wstawiasz zwykły tekst, użyj textContent zamiast innerHTML. Jeśli potrzebujesz HTML, zastosuj sprawdzoną sanitację.'},
  'console-log':{title:'Ogranicz logowanie',advice:'Usuń zbędny log lub upewnij się, że nie wypisuje danych wrażliwych.'},
  'document-write':{title:'Zastąp document.write',advice:'Buduj elementy przez createElement i textContent zamiast wstrzykiwać HTML.'},
  'insecure-http':{title:'Sprawdź HTTPS',advice:'Użyj HTTPS, jeśli serwer go obsługuje. Zweryfikuj adres i konfigurację CORS.'},
  'tls-verification-disabled':{title:'Włącz weryfikację TLS',advice:'Nie ustawiaj rejectUnauthorized na false. Skonfiguruj poprawny certyfikat i zaufane CA.'},
  'postmessage-wildcard':{title:'Ogranicz odbiorcę wiadomości',advice:'Zastąp * dokładnym, zaufanym origin i sprawdzaj origin po stronie odbiorcy.'},
  'hardcoded-secret':{title:'Usuń sekret z kodu',advice:'Przenieś sekret do zmiennych środowiskowych po stronie serwera i unieważnij ujawniony klucz.'}
 };
 function suggestFixes(report){
  if(!report||!Array.isArray(report.findings)||report.readOnly!==true)throw Error('Invalid inspection report');
  return Object.freeze({readOnly:true,applied:false,suggestions:report.findings.slice(0,50).map(f=>Object.freeze({line:f.line,severity:f.severity,title:(FIXES[f.rule]||{title:'Sprawdź ostrzeżenie'}).title,advice:(FIXES[f.rule]||{advice:'Zweryfikuj ten fragment ręcznie.'}).advice}))});
 }
 const api={suggestFixes};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GuardCodeFix=api;
})(typeof window!=='undefined'?window:null);
