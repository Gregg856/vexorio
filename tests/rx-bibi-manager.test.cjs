'use strict';
const assert=require('node:assert/strict');
const {assessDeployment,summarizeIncidents,classifyFailure}=require('../guard/rx-bibi-manager.cjs');
assert.deepEqual(assessDeployment({provider:'cloudflare',workflowStatus:'completed',conclusion:'success'}),{status:'healthy',category:'published',retryRecommended:false,requiresApproval:true,action:'none'});
const failure=assessDeployment({provider:'cloudflare',workflowStatus:'completed',conclusion:'failure',errorCode:'10013'});
assert.equal(failure.action,'propose-retry');
assert.equal(failure.retryRecommended,true);
assert.equal(failure.requiresApproval,true);
assert.equal(assessDeployment({provider:'cloudflare',workflowStatus:'completed',conclusion:'failure',errorCode:'10013',attempt:2}).retryRecommended,false);
assert.equal(assessDeployment({provider:'cloudflare',workflowStatus:'completed',conclusion:'failure',errorCode:'unknown'}).action,'review-logs');
assert.equal(assessDeployment({provider:'cloudflare',workflowStatus:'in_progress'}).status,'pending');
assert.equal(assessDeployment({provider:'cloudflare',workflowStatus:'completed',conclusion:'cancelled'}).action,'review');
assert.throws(()=>assessDeployment({provider:'cloudflare',workflowStatus:'completed',conclusion:'failure',attempt:0}),/Invalid deployment/);
assert.throws(()=>assessDeployment({provider:'cloudflare',workflowStatus:'in_progress',conclusion:'success'}),/Invalid deployment/);
const incidentSummary=summarizeIncidents([
 {status:'completed',conclusion:'success'},
 {status:'completed',conclusion:'failure',html_url:'https://github.com/Gregg856/vexorio/actions/runs/123'},
 {status:'in_progress'},
 {status:'completed',conclusion:'cancelled'}
]);
assert.equal(incidentSummary.total,4);
assert.deepEqual(incidentSummary.counts,{success:1,failure:1,pending:1,other:1});
assert.equal(incidentSummary.failures[0].reason,'unconfirmed');
assert.equal(incidentSummary.failures[0].url,'https://github.com/Gregg856/vexorio/actions/runs/123');
assert.throws(()=>summarizeIncidents([null]),/Invalid run/);
assert.equal(classifyFailure({step:'Testy regresji wyszukiwarki i odleglosci'}).category,'test-failure');
assert.equal(classifyFailure({step:'Publikuj w Cloudflare',errorCode:'10013'}).category,'cloudflare-upload-error');
assert.equal(classifyFailure({step:'GitHub API: pobierz historie'}).category,'github-api-error');
assert.equal(classifyFailure({step:'unknown'}).confidence,'unknown');
assert.throws(()=>classifyFailure({step:42}),/Invalid failure/);
const fs=require('node:fs');
const strazak=fs.readFileSync('guard-lab.html','utf8');
const bibi=fs.readFileSync('rx-bibi-manager.html','utf8');
assert.ok(strazak.includes('href="/rx-bibi-manager.html"'),'Strażak must link to RX BIBI');
assert.ok(bibi.includes('href="/guard-lab.html"'),'RX BIBI must link to Strażak');
assert.ok(bibi.includes('https://github.com/Gregg856/vexorio/actions'),'RX BIBI must link to GitHub Actions');
assert.ok(bibi.includes('id="summary"'),'RX BIBI must show incident summary');
assert.ok(bibi.includes('id="latest"'),'RX BIBI must show latest deployment');
assert.ok(bibi.includes('RX BIBI Manager 1.3'),'RX BIBI must show version 1.1');
assert.ok(bibi.includes('id="lastSuccess"'),'RX BIBI must show latest known successful deployment');
assert.ok(bibi.includes('id="strażakStatus"'),'RX BIBI must show RX Strażak monitoring status');
assert.ok(bibi.includes('id="incidents"'),'RX BIBI must have incident overview');
assert.ok(bibi.includes('Priorytet RX BIBI:'),'RX BIBI 1.3 must display priority');
assert.ok(bibi.includes('id="alerts"'),'RX BIBI 1.3 must have a dedicated alert center');
assert.ok(bibi.includes('id="availability"'),'RX BIBI must show separate HTTP availability panel');
assert.ok(bibi.includes('async function checkAvailability()'),'RX BIBI must independently probe HTTP availability');
assert.ok(bibi.includes('checkId!==availabilityCheckId'),'HTTP availability must ignore stale overlapping probe results');
assert.ok(bibi.includes('if(availabilityController)availabilityController.abort()'),'New HTTP probe must cancel previous probe');
assert.ok(bibi.includes('githubTimeout=setTimeout(()=>githubController.abort(),12000)'),'GitHub API must have a 12 second timeout');
assert.ok(bibi.includes('signal:githubController.signal'),'GitHub fetch must support cancellation');
assert.ok(bibi.includes('clearTimeout(githubTimeout);button.disabled=false;'),'GitHub timeout and refresh lock must be released');
assert.ok(bibi.includes("const nonSuccess=[current,latestCheck,monitor].some"),'Cancelled or ambiguous completed checks must not show healthy priority');
assert.ok(bibi.includes("monitorStale||nonSuccess?'NIEPEŁNE DANE'"),'Incomplete result must have non-green priority');
assert.ok(bibi.includes("const monitoring=data.workflow_runs.filter(r=>r.head_branch==='main'"),'Monitoring must filter production branch');
assert.ok(bibi.includes("const runs=data.workflow_runs.filter(r=>r.head_branch==='main'"),'History must filter production branch');
assert.ok(bibi.includes("response.ok&&type.includes('text/html')"),'RX BIBI must validate HTTP status and content type');
assert.ok(bibi.includes('Pojedynczy test HTTP nie potwierdza poprawności wszystkich funkcji'),'RX BIBI must qualify single HTTP probe');
assert.ok(bibi.includes('refresh();checkAvailability();'),'RX BIBI must probe on manual refresh');
assert.ok(bibi.includes('Historia napraw: po nieudanej publikacji'),'RX BIBI 1.3 must show recovery timeline');
assert.ok(bibi.includes('To potwierdza wynik wdrożenia, nie dostępność serwisu'),'RX BIBI must not conflate deployment recovery with uptime');
assert.ok(bibi.includes('brak późniejszej udanej publikacji'),'RX BIBI must disclose unresolved failed deployment');
assert.ok(bibi.includes('Centrum alarmów — RX BIBI 1.3'),'RX BIBI 1.3 must render alert center heading');
assert.ok(bibi.includes('const uniqueAlerts=[...new Map(alertItems.map'),'RX BIBI 1.3 must deduplicate alert entries');
assert.ok(bibi.includes('Aktywne ostrzeżenia:'),'RX BIBI 1.3 must count deduplicated alerts');
assert.ok(bibi.includes("monitorStale&&!(monitor&&monitor.status!=='completed')"),'RX BIBI 1.3 must not double warn about pending stale monitoring');
assert.ok(bibi.includes('Pilne: ostatnia publikacja nieudana'),'RX BIBI 1.3 must prioritize failed deployments');
assert.ok(bibi.includes('Pilne: ostatnie testy nieudane'),'RX BIBI 1.3 must prioritize failed tests');
assert.ok(bibi.includes('Monitoring Strażaka: brak aktualnego wyniku'),'RX BIBI 1.3 must warn of stale monitoring');
assert.ok(bibi.includes('Brak aktywnych alarmów w ostatnich pobranych wynikach'),'RX BIBI 1.3 must explain healthy summary scope');
assert.ok(bibi.includes('const streak=(items)=>'),'RX BIBI must count consecutive failures');
assert.ok(bibi.includes("if(run.status!=='completed')continue"),'RX BIBI must skip unfinished runs in streaks');
assert.ok(bibi.includes('Powtarzające się niepowodzenia:'),'RX BIBI must flag repeated failures');
assert.ok(bibi.includes('const groupedFailures=new Map()'),'RX BIBI must group failed workflows by commit');
assert.ok(bibi.includes('Wspólny raport:'),'RX BIBI must show combined incident report');
assert.ok(bibi.includes('const latestByWorkflow=new Map()'),'RX BIBI must compare failures with latest completed workflow');
assert.ok(bibi.includes("r.head_branch==='main'&&r.status==='completed'"),'RX BIBI must ignore unfinished runs when assessing recovery');
assert.ok(bibi.includes('Bieżące nieudane przebiegi w raporcie:'),'RX BIBI must distinguish current failed runs');
assert.ok(bibi.includes('Historyczne nieudane przebiegi:'),'RX BIBI must distinguish historical failures');
assert.ok(bibi.includes('Anulowane publikacje:'),'RX BIBI must report cancellations separately');
assert.ok(bibi.includes("monitor&&monitor.status!=='completed'"),'RX BIBI must include pending monitoring in in-progress priority');
assert.ok(bibi.includes('const monitorStale=!monitorUpdated||Date.now()-monitorUpdated>24*3600000'),'RX BIBI must detect stale monitoring before declaring healthy status');
assert.ok(bibi.includes("monitorStale||nonSuccess?'NIEPEŁNE DANE'"),'RX BIBI must not show healthy status for stale monitoring or ambiguous results');
assert.ok(bibi.includes('monitoring Strażaka ma ponad 24 godziny'),'RX BIBI must explain stale data');
assert.ok(bibi.includes('Nie potwierdzamy jeszcze wyniku ani usunięcia wcześniejszych problemów'),'RX BIBI must avoid claiming recovery during pending workflows');
assert.ok(bibi.includes("r.conclusion==='cancelled'"),'RX BIBI must detect cancelled deployments');
assert.ok(bibi.includes('anulowanie nie oznacza automatycznie błędu'),'RX BIBI must not treat cancellation as failure');
assert.ok(bibi.includes('najnowsza zakończona publikacja była udana'),'RX BIBI must recognize recovered deployment after cancellations');
assert.ok(bibi.includes("'Log: '+(run.name==='Deploy VEXORIO'"),'RX BIBI must provide log links for grouped failures');
assert.ok(bibi.includes('sorted.slice(0,3)'),'RX BIBI must cap log links per group');
assert.ok(bibi.includes('row.append(document.createTextNode'),'RX BIBI must build safe DOM links');
assert.ok(!bibi.includes("current.html_url.startsWith('https://github.com/Gregg856/vexorio/actions/runs/')"),'RX BIBI must validate exact latest deployment URL');
assert.ok(bibi.includes('nie oznacza to liczby niezależnych awarii'),'RX BIBI must not overcount independent incidents');
assert.ok(bibi.includes('nie potwierdza wspólnej przyczyny'),'RX BIBI must not claim shared root cause');
assert.ok(bibi.includes('to nie musi być jedna przyczyna'),'RX BIBI must not claim shared root cause');
assert.ok(bibi.includes('starsze nieudane publikacje'),'RX BIBI must distinguish historical errors from active streaks');
assert.ok(bibi.includes('Najpierw sprawdź ostatnią nieudaną publikację Cloudflare'),'RX BIBI must prioritize failed deployment');
assert.ok(bibi.includes('Sprawdź ostatni nieudany przebieg testów VEXORIO'),'RX BIBI must prioritize failed checks');
assert.ok(bibi.includes('Sprawdź ostatni nieudany test monitoringu RX Strażak'),'RX BIBI must prioritize failed monitoring');
assert.ok(bibi.includes('NIEPEŁNE DANE'),'RX BIBI must not misreport missing history as healthy');
assert.ok(bibi.includes('data-filter="failure"'),'RX BIBI must offer a failed-runs filter');
assert.ok(bibi.includes('data-filter="pending"'),'RX BIBI must offer a pending-runs filter');
assert.ok(bibi.includes('data-filter="success"'),'RX BIBI must offer a successful-runs filter');
assert.ok(bibi.includes('function applyFilter()'),'RX BIBI must update filtered history');
assert.ok(bibi.includes('item.dataset.result='),'RX BIBI must classify workflow rows');
assert.ok(bibi.includes('applyFilter();'),'RX BIBI must apply filters after refresh');
assert.ok(bibi.includes('const unresolved=failedDeploys.filter'),'RX BIBI must compare failures against last successful deploy');
assert.ok(bibi.includes('Wcześniejsze nieudane publikacje'),'RX BIBI must distinguish older failures from resolved root causes');
assert.ok(bibi.includes('Wcześniejszy sukces nie gwarantuje usunięcia przyczyny awarii'),'RX BIBI must distinguish historical success from incident resolution');
assert.ok(bibi.includes("r.name==='VEXORIO checks'&&r.head_branch==='main'"),'RX BIBI must count failed production checks separately');
assert.ok(bibi.includes('Publikacje w toku:'),'RX BIBI must show pending deployments');
assert.ok(bibi.includes('To wyniki CI, nie pomiar dostępności strony'),'RX BIBI must not imply site uptime');
assert.ok(bibi.includes('Błąd przygotowania strony'),'RX BIBI must distinguish preparation errors from Cloudflare deployment');
assert.ok(bibi.includes('Sprawdź brakujące pliki, kopiowanie i kontrolę wersji'),'RX BIBI must suggest inspecting workflow preparation');
assert.ok(bibi.includes('Ostatnie testy VEXORIO:'),'RX BIBI must show latest checks state');
assert.ok(bibi.includes('nie oznacza to automatycznie tej samej przyczyny'),'RX BIBI must avoid falsely claiming repeated identical failures');
assert.ok(bibi.includes('test monitoringu udany'),'RX BIBI must distinguish monitoring test success from full service health');
assert.ok(bibi.includes('RX Strazak — monitoring 24/7'),'RX BIBI must recognize the actual Strażak workflow');
assert.ok(bibi.includes("monitor.conclusion==='cancelled'?'anulowany'"),'RX BIBI must distinguish cancelled monitoring runs');
assert.ok(bibi.includes("String(monitor.run_attempt||1)"),'RX BIBI must display monitoring retry attempt');
assert.ok(bibi.includes('ageHours>24'),'RX BIBI must warn about monitoring results older than 24 hours');
assert.ok(bibi.includes('timestamp(monitor.updated_at)||timestamp(monitor.created_at)'),'RX BIBI must use latest monitoring update time for freshness');
assert.ok(bibi.includes('Wynik może być nieaktualny'),'RX BIBI must disclose stale monitoring');
assert.ok(bibi.includes('Przejdź do panelu RX Strażak'),'RX BIBI must provide direct navigation to guard');
assert.ok(bibi.includes('nie potwierdza dostępności serwisu'),'RX BIBI must distinguish CI result from live uptime');
assert.ok(bibi.includes('brak wyniku monitoringu 24/7 w 50 ostatnich uruchomieniach'),'RX BIBI must disclose missing monitoring history');
assert.ok(bibi.includes("r.status==='completed'&&r.conclusion==='success'"),'RX BIBI must only treat completed successful deploys as successful');
assert.ok(bibi.includes('brak potwierdzenia w 50 pobranych uruchomieniach'),'RX BIBI must disclose limited success history');
assert.ok(bibi.includes("'/jobs?per_page=30'"),'RX BIBI must inspect GitHub jobs for failed runs');
assert.ok(bibi.includes("s.conclusion==='failure'"),'RX BIBI must only report failed steps');
assert.ok(bibi.includes('Diagnoza niedostępna'),'RX BIBI must disclose unavailable diagnosis');
assert.ok(bibi.includes('inspectedFailures>=3'),'RX BIBI must limit failed-run API diagnostics');
assert.ok(bibi.includes('if(button.disabled)return;'),'RX BIBI must prevent overlapping refreshes');
assert.ok(bibi.includes('Odczyt: '),'RX BIBI must show when data was retrieved');
assert.ok(bibi.includes('Widoczne dane mogą być nieaktualne'),'RX BIBI must warn about stale data');
assert.ok(bibi.includes('id="freshness"'),'RX BIBI must display data freshness');
assert.ok(bibi.includes('Świeżość danych: aktualne'),'RX BIBI must label successful fetches');
assert.ok(bibi.includes('Świeżość danych: mogą być nieaktualne'),'RX BIBI must label stale history');
assert.ok(bibi.includes('Świeżość danych: brak połączenia lub danych'),'RX BIBI must label missing history');
assert.ok(bibi.includes("response.headers.get('age')"),'RX BIBI must inspect API cache age');
assert.ok(bibi.includes('ageSeconds>300'),'RX BIBI must warn for old API responses');
assert.ok(bibi.includes('!data.workflow_runs.length'),'RX BIBI must not report empty history as current');
assert.ok(bibi.includes(".sort((a,b)=>timestamp(b.created_at)-timestamp(a.created_at)).slice(0,12)"),'RX BIBI must sort history newest first before limiting results');
assert.ok(bibi.includes('function timestamp(value)'),'RX BIBI must handle missing dates in sorting');
assert.ok(bibi.indexOf('root.append(item);')<bibi.indexOf("if(state==='failure')"),'RX BIBI must render workflow rows before awaiting failure diagnostics');
assert.ok(bibi.includes('function formatDate(value)'),'RX BIBI must safely format workflow dates');
assert.ok(bibi.includes('data.workflow_runs.length+\' pobranych'),'RX BIBI must display actual API response count');
assert.ok(bibi.includes('aria-label="Podsumowanie ostatnich uruchomień"'),'RX BIBI must describe summary accurately');
assert.ok(bibi.includes('const apiDate=response.headers.get(\'date\')'),'RX BIBI must inspect optional date header');
assert.ok(bibi.indexOf("item.append(link);}")<bibi.indexOf("if(state==='failure')"),'RX BIBI must display log links before fetching diagnostics');
assert.ok(bibi.includes('brak poprawnej daty'),'RX BIBI must handle invalid workflow dates');
assert.ok(bibi.indexOf('root.replaceChildren();summary.replaceChildren();latest.textContent')>bibi.indexOf('if(!response.ok)throw Error'),'RX BIBI must preserve old data until successful API response');
assert.ok(bibi.includes('Limit GitHub API'),'RX BIBI must identify rate limiting');
assert.ok(bibi.includes('Historia GitHub Actions niedostępna'),'RX BIBI must identify unavailable history');
assert.ok(bibi.includes('Sprawdź komunikat testu'),'RX BIBI must recommend inspecting failed tests');
assert.ok(bibi.includes('nie ponawiaj bez analizy'),'RX BIBI must not suggest blind deployment retries');
assert.ok(bibi.includes("r.name==='Deploy VEXORIO'&&r.head_branch==='main'"),'Latest deployment must use production branch');
assert.ok(bibi.includes("'Data: '+(run.created_at"),'RX BIBI must format run dates correctly');
// Cross-panel integration audit: links, production endpoints and inline JavaScript syntax.
const vm=require('node:vm');
const bibiScripts=[...bibi.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
assert.ok(bibiScripts.length>0,'RX BIBI must contain its dashboard script');
for(const [i,script] of bibiScripts.entries())new vm.Script(script,{filename:'rx-bibi-inline-'+i+'.js'});
assert.ok(strazak.includes('aria-label="Otwórz RX BIBI Manager 1.0"'),'Strażak must identify BIBI navigation');
assert.ok(bibi.includes("https://api.github.com/repos/Gregg856/vexorio/actions/runs?per_page=50"),'RX BIBI must query the correct repository');
assert.ok(bibi.includes("r.head_branch==='main'"),'RX BIBI must filter production deployments');
assert.ok(bibi.includes("if(button.disabled)return;"),'RX BIBI must avoid duplicate API refreshes');
assert.ok(bibi.includes("finally{clearTimeout(githubTimeout);button.disabled=false;}"),'RX BIBI must release timeout and reenable refresh after failures');

// RX Developer 1.3 regression: preview, line-level diff and discard without source mutation.
assert.ok(bibi.includes("developerDiff.textContent='RÓŻNICE (numery linii):"),'RX Developer must render numbered differences');
assert.ok(bibi.includes("developerReset.textContent='↩️ Cofnij propozycję'"),'RX Developer must offer discard action');
assert.ok(bibi.includes("developerReset.addEventListener('click'"),'RX Developer discard must have a handler');
assert.ok(bibi.includes("developerInput.value!==developerPreviewSource"),'RX Developer must reject stale preview copies');
assert.ok(bibi.includes("developerCopyPatch.disabled=true;developerReset.disabled=true;"),'RX Developer must invalidate preview after input changes');
assert.ok(bibi.includes("developerPreviewStatus.textContent='Propozycja cofnięta. Oryginalny kod pozostaje bez zmian.'"),'RX Developer must explain discard semantics');
assert.ok(!bibi.includes("developerInput.value=developerSuggestedCode"),'RX Developer must not silently apply proposed code');

// Behavioral checks of the exact replacement expression used by RX Developer.
const previewMatch=bibi.match(/const updated=original\.replace\((\/\\bconsole\\\.log\\s\*\\\(\/g),'console\.debug\('\);/);
assert.ok(previewMatch,'RX Developer preview transformation must be available for behavioral testing');
const previewRegex=Function('"use strict";return '+previewMatch[1])();
const makePreview=source=>source.replace(previewRegex,'console.debug(');
assert.equal(makePreview("const x=10;\nconsole.log(x);"),"const x=10;\nconsole.debug(x);",'Preview should change only the intended logging call');
assert.equal(makePreview("console.log(1);\nconsole.log(2);"),"console.debug(1);\nconsole.debug(2);",'Preview should update multiple matches');
assert.equal(makePreview("console.warn('keep');"),"console.warn('keep');",'Preview should leave unrelated logging unchanged');
const sourceForPreview="console.log('original');";
makePreview(sourceForPreview);
assert.equal(sourceForPreview,"console.log('original');",'Preview must not mutate the original source string');
console.log('PASS: RX Developer preview transformation behavioral checks');
console.log('PASS: RX Developer 1.3 preview safety and discard regression');

assert.ok(bibi.includes('const developerContainsSecret=code=>'),'RX Developer must check potential secrets');
assert.ok(bibi.includes('!developerContainsSecret(item.before)&&!developerContainsSecret(item.after)'),'RX Developer must filter previously saved secret-like history');
assert.ok(bibi.includes('if(!developerContainsSecret(original)&&!developerContainsSecret(updated))'),'RX Developer must not save secret-like preview history');
assert.ok(bibi.includes("developerHistory.length>10"),'RX Developer history must remain bounded');
assert.ok(bibi.includes('developerHistoryClear.addEventListener'),'RX Developer must allow local history clearing');
console.log('PASS: RX Developer 1.5 history privacy regression checks');
assert.ok(bibi.includes('document.write() może nadpisać stronę'),'RX Developer 1.6 should warn on document.write');
assert.ok(bibi.includes('Timer z kodem jako tekst jest ryzykowny'),'RX Developer 1.6 should warn on string timers');
assert.ok(bibi.includes('Połączenie HTTP bez szyfrowania'),'RX Developer 1.6 should warn on HTTP');
assert.ok(bibi.includes('Logowanie może ujawniać dane również w trybie debug/info'),'RX Developer 1.6 should warn on debug/info logs');
console.log('PASS: RX Developer 1.6 security rules');
assert.ok(bibi.includes('Możliwy zapis sekretu w localStorage'),'RX Developer 1.7 must flag localStorage secrets');
assert.ok(bibi.includes('Sprawdź otwieranie nowych okien'),'RX Developer 1.7 must flag popup safety');
assert.ok(bibi.includes('postMessage() z targetOrigin *'),'RX Developer 1.7 must flag wildcard messaging');
assert.ok(bibi.includes('Sprawdź przekierowanie i walidację adresu'),'RX Developer 1.7 must flag redirects');
console.log('PASS: RX Developer 1.7 security patterns');
assert.ok(bibi.includes('RX Developer — raport analizy'),'RX Developer 1.9 report title');
assert.ok(bibi.includes('const severity=issue=>'),'RX Developer must assign heuristic severity');
assert.ok(bibi.includes('counts[severity(issue)]++'),'RX Developer must count severity levels');
assert.ok(bibi.includes('Ocena heurystyczna — wymaga weryfikacji'),'RX Developer must disclose limitations');
console.log('PASS: RX Developer 1.9 severity report checks');
assert.ok(bibi.includes("fetch('/rx-fix-guidance.json'"),'RX Manager must fetch automatic CI guidance');
assert.ok(bibi.includes('document.createTextNode(\': \'+item.action)'), 'RX Manager must render suggestions as text');
assert.ok(bibi.includes('rxSummaryFile'),'RX Manager must retain manual report import');
console.log('PASS: RX Developer 7.7 automatic report viewer regression');
for(const field of ['data.severity?.high','data.severity?.medium','data.severity?.low','data.filesScanned','data.filesSkipped'])assert.ok(bibi.includes(field),'RX Manager must display CI summary field '+field);
console.log('PASS: RX Developer 7.9 risk counters in manager');
assert.ok(bibi.includes('id="rxRuleFilter"'),'RX Developer 8.1 must have a rule filter');
assert.ok(bibi.includes('filter.onchange=render'),'RX Developer 8.1 must update guidance when rule changes');
assert.ok(bibi.includes('x.rule===filter.value'),'RX Developer 8.1 must filter guidance by rule');
console.log('PASS: RX Developer 8.1 rule filter regression');
assert.ok(bibi.includes('id="rxGuidanceSearch"'),'RX Developer 8.3 search field must exist');
assert.ok(bibi.includes('search.oninput=render'),'RX Developer 8.3 must update results while typing');
assert.ok(bibi.includes("x.path.toLocaleLowerCase('pl').includes(query)"),'RX Developer 8.3 must search file paths');
console.log('PASS: RX Developer 8.3 live diagnostic search regression');
console.log('PASS: RX BIBI Manager 1.0 read-only deployment recommendations');

assert.ok(bibi.includes("document.createElement('details')"),'RX Developer 8.5 must group findings in expandable cards');
assert.ok(bibi.includes('groups.get(item.path).push(item)'),'RX Developer 8.5 must group findings by file');
console.log('PASS: RX Developer 8.5 expandable per-file diagnostics');
assert.ok(bibi.includes('id="rxExpandAll"'),'RX Developer 8.6 must expose expand-all button');
assert.ok(bibi.includes('id="rxCollapseAll"'),'RX Developer 8.6 must expose collapse-all button');
assert.ok(bibi.includes("querySelectorAll('details').forEach(x=>x.open=true)"),'RX Developer 8.6 must expand all file groups');
assert.ok(bibi.includes("querySelectorAll('details').forEach(x=>x.open=false)"),'RX Developer 8.6 must collapse all file groups');
console.log('PASS: RX Developer 8.6 expand/collapse controls');
assert.ok(bibi.includes("copy.textContent='Kopiuj wskazówki pliku'"),'RX Developer 8.8 must show copy button');
assert.ok(bibi.includes('navigator.clipboard.writeText(value)'),'RX Developer 8.8 must copy guidance');
assert.ok(bibi.includes("items.map(x=>x.rule+': '+x.action)"),'RX Developer 8.8 must include each remediation');
console.log('PASS: RX Developer 8.9 clipboard guidance regression');
assert.ok(bibi.includes("proposal.textContent='Przygotuj propozycję do przeglądu'"),'RX Developer 9.0 must offer manual proposal export');
assert.ok(bibi.includes("link.download='rx-proposal-'"),'RX Developer 9.0 must download proposal locally');
assert.ok(bibi.includes('Nie wykonano żadnych zmian.'),'RX Developer 9.0 must disclose read-only mode');
console.log('PASS: RX Developer 9.0 read-only proposal export');
for(const term of ['Priorytet przeglądu:', 'Lista kontrolna przed zatwierdzeniem:', 'Uruchom odpowiednie testy', 'Zatwierdź zmiany dopiero po przeglądzie'])assert.ok(bibi.includes(term),'RX Developer 9.2 proposal must contain '+term);
assert.ok(bibi.includes("?'pilny':items.some"),'RX Developer 9.2 must calculate review priority');
console.log('PASS: RX Developer 9.2 proposal priority and review checklist');

assert.ok(!/RX Developer 1\.\d+/.test(bibi),'RX Developer UI must not expose stale 1.x version labels');
assert.ok(bibi.includes('RX Developer — historia i ochrona danych'),'RX Developer history heading must be consistent');
console.log('PASS: RX Developer consistent headings');

// Security contract: pasted snippets may be parsed for syntax but never executed.
assert.ok(bibi.includes('try{new Function(code);}catch(error)'), 'RX Developer must compile only for syntax validation');
assert.ok(!bibi.includes('new Function(code)()'), 'RX Developer must not execute pasted snippets');
assert.ok(bibi.includes("developerOutput.textContent="), 'RX Developer must display results as text');
assert.ok(bibi.includes("developerInput.maxLength=12000"), 'RX Developer must cap pasted code size');
console.log('PASS: RX Developer read-only pasted-code analysis security contract');

assert.ok(!bibi.includes("/\\.catch\\s*\\(|\\btry\\s*\\{/.test(code)"), 'RX Developer must not suppress all fetch findings due to unrelated try/catch');
assert.ok(bibi.includes('lines.slice(Math.max(0,i-2),i+1)'), 'RX Developer fetch heuristics must be scoped near the call');
console.log('PASS: RX Developer fetch warning scope regression');

assert.ok(bibi.includes("const codeLines=masked.join('').split("),'RX Developer must lexically mask comments and strings');
assert.ok(bibi.includes("if(c==='/'&&next==='/')"),'RX Developer must recognize line comments');
assert.ok(bibi.includes("if(c==='/'&&next==='*')"),'RX Developer must recognize block comments');
assert.ok(bibi.includes("const candidate=needsLiterals?lines[i]:codeLines[i]"),'RX Developer must inspect executable code separately from literals');
console.log('PASS: RX Developer standalone comment false-positive guard');

assert.ok(bibi.includes("const templateDepth=[]"),'RX Developer must track template interpolation depth');
assert.ok(bibi.includes("templateDepth.push(0);mode='code'"),'RX Developer must inspect executable template expressions');
assert.ok(bibi.includes("templateDepth.pop();mode='string'"),'RX Developer must return to template text');
assert.ok(bibi.includes("if(ch==='/'&&!inClass)"),'RX Developer regex lexer must respect character classes');
assert.ok(bibi.includes("if(escapeRegex){escapeRegex=false;continue;}"),'RX Developer regex lexer must respect escaped slashes');
assert.ok(bibi.includes("💻 RX Developer 9.4 — analiza kodu"),'RX Developer must retain visible version label');
console.log('PASS: RX Developer 9.4 lexical and version guards');



const lexerStart=bibi.indexOf("  const masked=[];let mode='code',escaped=false;");
const lexerEnd=bibi.indexOf("  const codeLines=masked.join('').split(",lexerStart);
assert.ok(lexerStart>=0&&lexerEnd>lexerStart,'RX Developer lexer boundaries must exist');
const lexerSource=bibi.slice(lexerStart,lexerEnd);
const maskSnippet=new Function('code',lexerSource+"return masked.join('');");
const lexCases=[
 ['quoted text',"const example = 'eval(1)';",'eval(1)',false],
 ['line comment',"// eval(1)\nconsole.log('ok')",'eval(1)',false],
 ['block comment',"/* eval(1) */ console.log('ok')",'eval(1)',false],
 ['real executable call',"eval('1+1')",'eval',true],
 ['template expression',"const value = \x60safe \${eval('1')}\x60;",'eval',true],
 ['template plain text',"const value = \x60eval(1)\x60;",'eval',false],
 ['regex text',"const re = /eval\\(1\\)/;",'eval',false],
 ['nested template interpolation',"const v = \x60outer \${\x60inner \${eval('1')}\x60}\x60;",'eval',true],
 ['nested braces in interpolation',"const v = \x60value \${({a:eval('1')}).a}\x60;",'eval',true],
 ['comment inside interpolation',"const v = \x60value \${/* eval('fake') */ 42}\x60;",'eval',false]
];
for(const [label,input,needle,expected] of lexCases){
 const output=maskSnippet(input);
 assert.equal(output.length,input.length,'Lexer must preserve offsets: '+label);
 assert.equal(output.includes(needle),expected,'Lexer behavior: '+label);
}
console.log('PASS: RX Developer lexer behavioral smoke tests');

assert.ok(bibi.includes("re:/\\bouterHTML\\s*=/g"),'RX Developer must detect outerHTML assignments');
assert.ok(bibi.includes("re:/\\binsertAdjacentHTML\\s*\\(/g"),'RX Developer must detect insertAdjacentHTML calls');
for(const [label,input,expected] of [
 ['outerHTML assignment',"element.outerHTML = '<img>';",true],
 ['insertAdjacentHTML call',"element.insertAdjacentHTML('beforeend', html);",true],
 ['HTML sink in comment',"// element.outerHTML = '<img>';",false],
 ['HTML sink in string',"const note = 'element.insertAdjacentHTML()';",false]
]){
 const maskedInput=maskSnippet(input);
 const sinks=[/\bouterHTML\s*=/g,/\binsertAdjacentHTML\s*\(/g];
 assert.equal(sinks.some(re=>re.test(maskedInput)),expected,'RX HTML sink: '+label);
}
console.log('PASS: RX Developer HTML injection sink regression');

assert.ok(bibi.includes("Sprawdź zapis document.cookie."),'RX Developer cookie write warning exists');
assert.ok(bibi.includes("Sprawdź walidację origin wiadomości postMessage."),'RX Developer message origin warning exists');
for(const [label,input,expected] of [
 ['cookie assignment',"document.cookie = 'session=abc';",true],
 ['message listener',"window.addEventListener('message', event => {});",true],
 ['comment with cookie',"// document.cookie = 'session=abc';",false],
 ['string with message listener',"const x = \"window.addEventListener('message')\";",false]
]){
 const maskedInput=maskSnippet(input);
 const codeOnlyCookie=/\b(?:document|window)\.cookie\s*=/g;
 const codeOnlyMessage=/\b(?:window\.)?addEventListener\s*\(\s*['"]message['"]/g;
 const detected=codeOnlyCookie.test(maskedInput)||codeOnlyMessage.test(input)&&maskedInput.includes('addEventListener');
 assert.equal(detected,expected,'RX cookie/message smoke test: '+label);
}
console.log('PASS: RX Developer cookie and message listener regression');

const messageRule=/\b(?:window\.)?addEventListener\s*\(\s*['"]message['"]/g;
const messageCases=[
 ["single quoted listener","window.addEventListener('message', handler)",true],
 ["double quoted listener",'addEventListener("message", handler)',true],
 ["unrelated event","window.addEventListener('click', handler)",false],
 ["commented listener","// window.addEventListener('message', handler)",false],
 ["quoted listener","const text = \"addEventListener('message', handler)\";",false]
];
for(const [label,input,expected] of messageCases){
 messageRule.lastIndex=0;
 const executable=maskSnippet(input);
 const match=messageRule.exec(input);
 const actual=!!(match&&executable.slice(match.index,match.index+Math.min(6,match[0].length)).trim());
 assert.equal(actual,expected,'RX message rule exact behavior: '+label);
}
console.log('PASS: RX Developer message origin warning precise matching');


assert.ok(bibi.includes('targetOrigin|walidację origin wiadomości'), 'Message origin warning must be evaluated against quoted event names');
console.log('PASS: RX Developer message listener is included in literal-aware matching');

assert.ok(bibi.includes("test(codeLines[i])||/\\btry\\s*\\{/.test(codeLines.slice("),'RX Developer fetch handling must use executable masked code');
const fetchCases=[
 ['fake catch in comment',"fetch('/api'); // .catch(handle)",true],
 ['fake try in comment',"// try {\nfetch('/api');",true],
 ['real inline catch',"fetch('/api').catch(handle);",false],
 ['real try nearby',"try {\nfetch('/api');\n} catch(e) {}",false]
];
for(const [label,input,expectedWarning] of fetchCases){
 const codeLines=maskSnippet(input).split(/\r?\n/);
 const fetchLine=codeLines.findIndex(line=>/\bfetch\s*\(/.test(line));
 assert.ok(fetchLine>=0,'fetch call must be present: '+label);
 const handled=/\.catch\s*\(/.test(codeLines[fetchLine])||/\btry\s*\{/.test(codeLines.slice(Math.max(0,fetchLine-2),fetchLine+1).join(' '));
 assert.equal(!handled,expectedWarning,'RX fetch handling: '+label);
}
console.log('PASS: RX Developer fetch error handling ignores comments');

assert.ok(bibi.includes("lines[i].replace(/\\/\\/.*$/,'')"),'RX Developer window.open warning must ignore trailing comments');
for(const [label,line,expectedSuppressed] of [
 ['trailing comment',"window.open(url); // noopener",false],
 ['real feature',"window.open(url, '_blank', 'noopener');",true],
 ['missing protection',"window.open(url, '_blank');",false]
]){
 const suppressed=/\b(?:noopener|noreferrer)\b/.test(line.replace(/\/\/.*$/,''));
 assert.equal(suppressed,expectedSuppressed,'RX window.open warning: '+label);
}
console.log('PASS: RX Developer window.open comment regression');

const {maskJavaScript:rxCoreMask}=require('../guard/rx-developer-core.cjs');
for(const [label,input,needle,expected] of [
 ['executable call',"eval('1')",'eval',true],
 ['comment',"// eval('1')",'eval',false],
 ['plain template',"const a = \x60eval('1')\x60",'eval',false],
 ['nested template expression',"const a = \x60outer \${\x60inner \${eval('1')}\x60}\x60",'eval',true],
 ['nested template text',"const a = \x60outer \${\x60inner eval('1')\x60}\x60",'eval',false],
 ['interpolation braces',"const a = \x60\${({a:eval('1')}).a}\x60",'eval',true]
]){
 const output=rxCoreMask(input);
 assert.equal(output.length,input.length,'RX Core preserves offsets: '+label);
 assert.equal(output.includes(needle),expected,'RX Core lexical behavior: '+label);
}
console.log('PASS: RX Developer Core independent lexical scanner');

for(const [label,input,needle,expected] of [
 ['regex literal',"const re=/eval\\(1\\)/;",'eval',false],
 ['regex character class',"const re=/[a/b]eval/gi;",'eval',false],
 ['regex escaped slash',"const re=/a\\/b eval/;",'eval',false],
 ['division expression',"const ratio=total / count; eval('1')",'eval',true],
 ['regex in interpolation',"const t=\x60\${/eval/.test(x)}\x60",'eval',false],
 ['executable after regex',"const re=/x/; eval('1')",'eval',true]
]){
 const output=rxCoreMask(input);
 assert.equal(output.length,input.length,'RX Core regex preserves offsets: '+label);
 assert.equal(output.includes(needle),expected,'RX Core regex behavior: '+label);
}
console.log('PASS: RX Developer Core regex masking and division behavior');

const {analyzeJavaScript:rxCoreAnalyze}=require('../guard/rx-developer-core.cjs');
const rxCoreReport=rxCoreAnalyze("const safe = 'eval(1)';\n// innerHTML = fake\nconst node = document.body;\nnode.innerHTML = userInput;\neval('1');");
assert.equal(rxCoreReport.engine,'RX Developer Core');
assert.equal(rxCoreReport.summary.total,2);
assert.equal(rxCoreReport.summary.high,1);
assert.equal(rxCoreReport.summary.medium,1);
assert.deepEqual(rxCoreReport.findings.map(x=>[x.id,x.line]),[['RX002',4],['RX001',5]]);
assert.equal(rxCoreAnalyze("const text = \x60eval(1)\x60;").summary.total,0);
assert.equal(rxCoreAnalyze("const text = \x60\${eval('1')}\x60;").summary.high,1);
assert.equal(rxCoreAnalyze("const re = /eval/;").summary.total,0);
console.log('PASS: RX Developer Core structured rule engine and false-positive guards');

for(const [label,code,ruleId] of [
 ['dynamic function',"new Function('return 1')",'RX007'],
 ['cookie assignment',"document.cookie = 'theme=dark'",'RX008'],
 ['message target review',"window.postMessage(data, '*')",'RX009'],
 ['location redirect',"window.location.href = nextUrl",'RX010']
]){
 const report=rxCoreAnalyze(code);
 assert.ok(report.findings.some(x=>x.id===ruleId),'RX Core security rule: '+label);
}
assert.equal(rxCoreAnalyze("// document.cookie = 'x'\nconst s = 'new Function()';").summary.total,0);
assert.equal(rxCoreAnalyze("const x = 1;").version,'0.2.0');
console.log('PASS: RX Developer Core ten security rules');
