'use strict';
const { chromium, devices } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.RX_BIBI_URL || 'https://vexorio.grzegorzbub1985.workers.dev';
const reportDir = path.resolve('rx-bibi-reports');
fs.mkdirSync(reportDir, { recursive: true });
const results = [];
const record = (name, passed, detail) => results.push({ name, passed, detail: String(detail || '') });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const incidentLog = [];
  let activePage = null;
  const logIncident = (source, type, detail) => incidentLog.push({ time: new Date().toISOString(), source, type, detail: String(detail).slice(0, 1200) });
  try {
    const page = await browser.newPage({ ...devices['Pixel 7'], locale: 'pl-PL' });
    activePage = page;
    // Proxy public GitHub API calls through the runner's short-lived token.
    // The token never reaches the page, its JavaScript or report artifacts.
    if(process.env.GITHUB_TOKEN){
      await page.route(/^https:\/\/api\.github\.com\//,async route=>{
        try{
          const original=route.request();
          const upstream=await fetch(original.url(),{
            method:original.method(),
            headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+process.env.GITHUB_TOKEN,'X-GitHub-Api-Version':'2022-11-28'},
            signal:AbortSignal.timeout(15000)
          });
          const body=await upstream.text();
          await route.fulfill({status:upstream.status,contentType:upstream.headers.get('content-type')||'application/json',body,headers:{'access-control-allow-origin':'*','cache-control':'no-store'}});
        }catch(err){console.error('RX GitHub API proxy:',err.message);await route.abort();}
      });
    }
    const jsErrors = [];
    const guardErrors = [];
    const diagnostics = [];
    const watch = (target, label, errors) => {
      target.on('pageerror', err => { errors.push(err.message); logIncident(label, 'javascript', err.stack || err.message); });
      target.on('console', msg => { if (msg.type() === 'error') { diagnostics.push(label + ' console: ' + msg.text()); logIncident(label, 'console', msg.text()); } });
      target.on('requestfailed', req => { const detail = req.method() + ' ' + new URL(req.url()).origin + new URL(req.url()).pathname + ' — ' + (req.failure()?.errorText || 'nieznany błąd'); diagnostics.push(label + ' sieć: ' + detail); logIncident(label, 'network', detail); });
      target.on('response', res => { if (res.status() >= 500) { const detail = res.status() + ': ' + new URL(res.url()).origin + new URL(res.url()).pathname; diagnostics.push(label + ' HTTP ' + detail); logIncident(label, 'http', detail); } });
    };
    watch(page, 'RX BIBI', jsErrors);
    const response = await page.goto(base + '/rx-bibi-manager.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    record('RX BIBI HTTP', response && response.status() === 200, response && response.status());
    // New RX workspace hides inactive sections. Open the relevant tab before asserting visibility.
    const openRxTab=async label=>{
      const nav=page.locator('.rx-side');
      const button=nav.locator('button').filter({hasText:label});
      if(await button.count()!==1)throw Error('Brak zakładki RX: '+label);
      await button.evaluate(el=>el.click());
      await page.waitForTimeout(100);
    };
    record('Nagłówek RX BIBI', await page.locator('h1').filter({hasText:/RX BIBI Manager/}).count() > 0);
    await openRxTab('🧪 Tester');
    const tester=page.getByRole('region',{name:'RX BIBI Tester'});
    record('Panel RX BIBI Tester widoczny',await tester.count()===1);
    try{
      await tester.getByText('🧪 RX BIBI Tester 1.0').waitFor({state:'visible',timeout:15000});
      const testerText=await tester.innerText();
      record('Wynik RX BIBI Tester',/Ostatni test:|Test w toku|Test zakończony:/.test(testerText),testerText.slice(0,300));
      const reportLink=tester.getByRole('link',{name:'Otwórz test i raporty'});
      const href=await reportLink.getAttribute('href');
      record('Link raportu RX BIBI Tester',typeof href==='string'&&href.startsWith('https://github.com/Gregg856/vexorio/actions/runs/')&&Number.isSafeInteger(Number(href.split('/').pop()))&&Number(href.split('/').pop())>0,href);
    }catch(error){record('Odczyt panelu RX BIBI Tester',false,error.message);}
    await openRxTab('🔎 Diagnostyka');
    const toolCenter=page.locator('[aria-label="Centrum narzędzi RX"]');
    record('Centrum narzędzi RX na telefonie',await toolCenter.count()===1);
    const incidentPanel=page.getByRole('region',{name:'Automatyczny rejestr awarii'});
    record('Rejestr awarii na telefonie',await incidentPanel.count()===1);
    const reportPanel=page.getByRole('region',{name:'Raport RX BIBI 1.6'});
    record('Raport RX BIBI 1.6 widoczny na telefonie',await reportPanel.count()===1);
    try {
      await reportPanel.getByText('📊 RX BIBI 1.6 — raport historii').waitFor({state:'visible',timeout:15000});
      const reportText=await reportPanel.innerText();
      record('RX BIBI 1.6 podsumowanie uruchomień',/Udane:\s*\d+.*Błędy:\s*\d+.*W toku:\s*\d+.*Pominięte:\s*\d+/.test(reportText),reportText.slice(0,450));
      record('RX BIBI 1.6 zakres historii',/maksymalnie 50 ostatnich rekordów/.test(reportText));
    } catch(error){record('RX BIBI 1.6 odczyt raportu',false,error.message);}

    await openRxTab('📚 Historia');
    const exportButton=page.getByRole('button',{name:/Pobierz raport JSON/});
    record('RX BIBI 1.7 przycisk eksportu',await exportButton.count()===1);
    try {
      await page.getByText(/RX BIBI 1.7 · Raport gotowy:/).waitFor({state:'visible',timeout:15000});
      record('RX BIBI 1.7 eksport gotowy',await exportButton.isEnabled());
      const download=await Promise.all([page.waitForEvent('download',{timeout:15000}),exportButton.click()]).then(([file])=>file);
      record('RX BIBI 1.7 nazwa pliku JSON',/^rx-bibi-raport-\d{4}-\d{2}-\d{2}\.json$/.test(download.suggestedFilename()),download.suggestedFilename());
      const exportShape=await page.evaluate(()=>({format:exportSnapshot?.format,hasSummary:!!exportSnapshot?.summary,hasRuns:Array.isArray(exportSnapshot?.runs),hasSecrets:JSON.stringify(exportSnapshot||{}).includes('access_token')}));
      record('RX BIBI 1.7 format danych',exportShape.format==='RX BIBI 1.7'&&exportShape.hasSummary&&exportShape.hasRuns&&!exportShape.hasSecrets,JSON.stringify(exportShape));
    }catch(error){record('RX BIBI 1.7 pobranie raportu',false,error.message);}
    try {
      await openRxTab('📚 Historia');
      await page.locator('[data-filter="failure"]').click();
      const filtered=await page.evaluate(()=>({
        filter:activeFilter,
        expected:exportSnapshot.runs.filter(r=>r.status==='completed'&&r.conclusion==='failure').length
      }));
      const filteredDownload=await Promise.all([page.waitForEvent('download',{timeout:15000}),exportButton.click()]).then(([file])=>file);
      const filteredPath=await filteredDownload.path();
      const fs=require('node:fs');
      const payload=JSON.parse(fs.readFileSync(filteredPath,'utf8'));
      record('RX BIBI 1.8 eksport tylko błędów',filtered.filter==='failure'&&payload.selected_filter==='failure'&&payload.runs.length===filtered.expected&&payload.runs.every(r=>r.status==='completed'&&r.conclusion==='failure')&&payload.summary.total===filtered.expected,JSON.stringify({expected:filtered.expected,actual:payload.runs.length}));
      record('RX BIBI 1.8 nazwa filtrowanego raportu',/-failure\.json$/.test(filteredDownload.suggestedFilename()),filteredDownload.suggestedFilename());
      await page.locator('[data-filter="all"]').click();
    }catch(error){record('RX BIBI 1.8 test filtrowanego eksportu',false,error.message);}
    record('Historia napraw na telefonie',await page.getByRole('region',{name:'Historia rozwiązanych problemów'}).count()===1);
    const mobileLinks=await toolCenter.locator('a').count();
    record('Nawigacja narzędzi RX',mobileLinks>=4,'Liczba linków: '+mobileLinks);
    const navigation=await toolCenter.locator('a[href^="#"]').evaluateAll(links=>links.map(link=>({href:link.getAttribute('href'),exists:!!document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)))})));
    record('Odnośniki do sekcji RX działają',navigation.length>0&&navigation.every(link=>link.exists),JSON.stringify(navigation));
    await openRxTab('🔎 Diagnostyka');
    const tapTargets=await toolCenter.locator('nav a').evaluateAll(links=>links.map(link=>({text:link.textContent.trim(),width:Math.round(link.getBoundingClientRect().width),height:Math.round(link.getBoundingClientRect().height)})));
    record('Przyciski narzędzi RX mieszczą się na telefonie',tapTargets.length>=3&&tapTargets.every(item=>item.width>=44&&item.height>=24),JSON.stringify(tapTargets));
    await openRxTab('🔎 Diagnostyka');
    try {
      await incidentPanel.getByText('🔎 Automatyczny rejestr awarii').waitFor({state:'visible',timeout:15000});
      const incidentText=await incidentPanel.innerText();
      record('RX BIBI 1.4 rejestr załadowany',/ostatnich|powiązanych uruchomieniach/i.test(incidentText),incidentText.slice(0,350));
      const priorityLabels=incidentPanel.locator('p').filter({hasText:/RX BIBI 1\.4 ·/});
      const priorityCount=await priorityLabels.count();
      const invalidLabels=await priorityLabels.filter({hasText:/undefined|NaN|\[object Object\]/}).count();
      record('RX BIBI 1.4 priorytety poprawne',invalidLabels===0,'Oznaczenia: '+priorityCount+', błędne: '+invalidLabels);
    } catch(error) {record('RX BIBI 1.4 diagnostyka rejestru',false,error.message);}
    const incidentStates=await incidentPanel.locator('p').filter({hasText:/AKTUALNA AWARIA|TEST W TOKU — wynik niepotwierdzony|OSTATNI PRZEBIEG UDANY \\(wymaga porównania\\)|WYNIK NIEJEDNOZNACZNY/}).allTextContents();
    record('RX BIBI 1.9 statusy bez fałszywego potwierdzenia',incidentStates.every(s=>!s.includes('undefined')&&!s.includes('NaN')),JSON.stringify(incidentStates.slice(0,5)));
    const incidentLinks=await incidentPanel.getByRole('link',{name:'Sprawdź najnowszy przebieg'}).count();
    record('RX BIBI 1.9 linki do aktualnego przebiegu',incidentStates.length===0||incidentLinks>=incidentStates.length,'Statusy: '+incidentStates.length+', linki: '+incidentLinks);
    const streakMessages=await incidentPanel.locator('p').filter({hasText:'RX BIBI 2.0 ·'}).allTextContents();
    const invalidStreaks=streakMessages.filter(s=>!/RX BIBI 2\.0 · (ALARM: co najmniej 3 kolejne nieudane przebiegi|UWAGA: 2 kolejne nieudane przebiegi|Ostatni zakończony przebieg nieudany|Brak bieżącej serii kolejnych awarii)/.test(s)||!s.includes('to nie jest dowód wspólnej przyczyny'));
    record('RX BIBI 2.0 komunikaty serii awarii',invalidStreaks.length===0,'Sprawdzone: '+streakMessages.length+', błędne: '+invalidStreaks.length);
    const priorityPanel=page.getByRole('region',{name:'RX BIBI 2.0 najważniejsze alarmy'});
    record('RX BIBI 2.0 panel alarmów widoczny',await priorityPanel.count()===1);
    try{
      await priorityPanel.getByText('🛡️ RX BIBI 2.0 — najważniejsze alarmy').waitFor({state:'visible',timeout:15000});
      const priorityText=await priorityPanel.innerText();
      record('RX BIBI 2.0 aktualny stan workflow',/Aktualnie nieudane workflow:|Brak potwierdzonych aktualnych awarii|Brak aktualnych awarii w dostępnej próbce/.test(priorityText),priorityText.slice(0,350));
      record('RX BIBI 2.0 ograniczenie próbki',priorityText.includes('Dotyczy tylko ostatnich pobranych przebiegów na main.'));
      const brokenCount=(priorityText.match(/Otwórz wynik/g)||[]).length;
      const links=await priorityPanel.getByRole('link',{name:'Otwórz wynik'}).count();
      record('RX BIBI 2.0 linki do awarii',brokenCount===links,'Linki: '+links);
    }catch(error){record('RX BIBI 2.0 test panelu alarmów',false,error.message);}
    const copyDiagnosis=priorityPanel.getByRole('button',{name:'📋 Kopiuj diagnozę RX BIBI'});
    record('RX BIBI raport — przycisk kopiowania',await copyDiagnosis.count()===1);
    try{
      await page.context().grantPermissions(['clipboard-read','clipboard-write']);
      await copyDiagnosis.click();
      const copied=await page.evaluate(()=>navigator.clipboard.readText());
      record('RX BIBI raport — treść w schowku',copied.includes('RX BIBI — raport diagnostyczny')&&copied.includes('Źródło: publiczne GitHub Actions')&&copied.includes('Dotyczy tylko ostatnich pobranych przebiegów na main.')&&copied.includes(String.fromCharCode(10)),copied.slice(0,180));
      record('RX BIBI raport — komunikat powodzenia',await priorityPanel.getByText('Skopiowano diagnozę do schowka.').count()===1);
      const firstHistory=await page.evaluate(()=>JSON.parse(localStorage.getItem('rx-bibi-diagnoses-v1')||'[]'));
      record('RX BIBI historia — pierwszy zapis',firstHistory.length===1&&typeof firstHistory[0].summary==='string',JSON.stringify(firstHistory));
      await copyDiagnosis.click();
      await openRxTab('📚 Historia');
      await page.getByRole('region',{name:'Historia diagnoz RX BIBI'}).getByText(/2\/10.*Poprzedni raport:/).waitFor({state:'visible',timeout:10000});
      const secondHistory=await page.evaluate(()=>JSON.parse(localStorage.getItem('rx-bibi-diagnoses-v1')||'[]'));
      const historyText=await page.getByRole('region',{name:'Historia diagnoz RX BIBI'}).innerText();
      record('RX BIBI historia — porównanie raportów',secondHistory.length===2&&historyText.includes('2/10')&&historyText.includes('Poprzedni raport:'),historyText.slice(0,240));
      const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('rx-bibi-diagnoses-v1')||'[]'));
      record('RX BIBI historia — trwałość zapisu lokalnego',persisted.length===2);
      const savedList=page.getByRole('region',{name:'Zapisane diagnozy RX BIBI'});
      record('RX BIBI historia — lista zapisanych diagnoz',await savedList.locator('details').count()===2);
      const exportButton=savedList.getByRole('button',{name:'⬇️ Eksportuj historię JSON'});
      record('RX BIBI eksport historii — przycisk',await exportButton.count()===1);
      const [download]=await Promise.all([page.waitForEvent('download',{timeout:15000}),exportButton.click()]);
      const downloadPath=await download.path();
      const exportData=JSON.parse(fs.readFileSync(downloadPath,'utf8'));
      record('RX BIBI eksport historii — nazwa pliku',/^rx-bibi-diagnozy-\d{4}-\d{2}-\d{2}\.json$/.test(download.suggestedFilename()),download.suggestedFilename());
      record('RX BIBI eksport historii — poprawny JSON',exportData.format==='rx-bibi-diagnoses'&&exportData.version===1&&exportData.source==='local-browser'&&Array.isArray(exportData.records)&&exportData.records.length===2&&exportData.records.every(item=>typeof item.date==='string'&&typeof item.summary==='string'));
      const afterExport=await page.evaluate(()=>JSON.parse(localStorage.getItem('rx-bibi-diagnoses-v1')||'[]'));
      record('RX BIBI eksport historii — nie usuwa wpisów',afterExport.length===2);
      const clearButton=savedList.getByRole('button',{name:'🗑️ Wyczyść historię diagnoz'});
      await clearButton.click();
      const beforeConfirm=await page.evaluate(()=>JSON.parse(localStorage.getItem('rx-bibi-diagnoses-v1')||'[]'));
      record('RX BIBI historia — wymaga potwierdzenia',beforeConfirm.length===2&&await savedList.getByRole('button',{name:/Potwierdź usunięcie/}).count()===1);
      await savedList.getByRole('button',{name:/Potwierdź usunięcie/}).click();
      const cleared=await page.evaluate(()=>localStorage.getItem('rx-bibi-diagnoses-v1'));
      record('RX BIBI historia — skuteczne usunięcie',cleared===null&&await savedList.locator('details').count()===0&&await savedList.getByText('Usunięto lokalną historię diagnoz.').count()===1);
      record('RX BIBI historia — licznik po usunięciu',(await page.getByRole('region',{name:'Historia diagnoz RX BIBI'}).innerText()).includes('0/10'));
      const importInput=savedList.getByLabel('Wybierz plik historii RX BIBI JSON');
      record('RX BIBI import — pole pliku',await importInput.count()===1);
      await importInput.setInputFiles({name:'rx-bibi-test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exportData))});
      await savedList.getByText('Zaimportowano historię. Zapisanych diagnoz: 2/10.').waitFor({state:'visible',timeout:10000});
      const imported=await page.evaluate(()=>JSON.parse(localStorage.getItem('rx-bibi-diagnoses-v1')||'[]'));
      record('RX BIBI import — odtworzenie z eksportu',imported.length===2&&await savedList.locator('details').count()===2);
      await importInput.setInputFiles({name:'rx-bibi-test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exportData))});
      await savedList.getByText('Zaimportowano historię. Zapisanych diagnoz: 2/10.').waitFor({state:'visible',timeout:10000});
      const deduped=await page.evaluate(()=>JSON.parse(localStorage.getItem('rx-bibi-diagnoses-v1')||'[]'));
      record('RX BIBI import — bez duplikatów',deduped.length===2);
      await importInput.setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"format":"unknown","records":[]}')});
      await savedList.getByText(/Import odrzucony:/).waitFor({state:'visible',timeout:10000});
      const afterInvalid=await page.evaluate(()=>JSON.parse(localStorage.getItem('rx-bibi-diagnoses-v1')||'[]'));
      record('RX BIBI import — odrzuca błędny plik bez utraty historii',afterInvalid.length===2);

    }catch(error){record('RX BIBI raport — kopiowanie na telefonie',false,error.message);}
    await openRxTab('🔎 Diagnostyka');
    const triagePanel=page.getByRole('region',{name:'RX BIBI 2.0 najważniejsze alarmy'});
    const triageText=await triagePanel.innerText();
    const hasActiveFailure=triageText.includes('Aktualnie nieudane workflow:');
    const hasTriage=triageText.includes('RX BIBI — proponowana kolejność: 1.');
    record('RX BIBI 2.0 diagnostyka przy aktywnej awarii',!hasActiveFailure||hasTriage,'Awaria: '+hasActiveFailure+', zalecenia: '+hasTriage);
    record('RX BIBI 2.0 brak automatycznych napraw',!hasTriage||triageText.includes('Żadna naprawa nie uruchamia się automatycznie.'));
    const diagnosticPlans=incidentPanel.locator('p').filter({hasText:'RX BIBI 1.5 · Plan diagnostyczny:'});
    const planCount=await diagnosticPlans.count();
    const incidentPriorities=await incidentPanel.locator('p').filter({hasText:'RX BIBI 1.4 ·'}).count();
    record('RX BIBI 1.5 plan dla każdej sklasyfikowanej awarii',planCount===incidentPriorities,'Plany: '+planCount+', priorytety: '+incidentPriorities);
    const unsafePlans=await diagnosticPlans.filter({hasText:/undefined|NaN|\\[object Object\\]/}).count();
    record('RX BIBI 1.5 czytelne podpowiedzi',unsafePlans===0,'Niepoprawne plany: '+unsafePlans);
    await openRxTab('👑 Królowa BIBI — czat');
    // Visual UX regression: mobile chat-first layout and navigation.
    const visual = await page.evaluate(() => {
      const menu=document.querySelector('.rx-menu-toggle');
      const nav=document.querySelector('.rx-side');
      const chat=document.querySelector('.rx-chat');
      const compose=document.querySelector('.rx-compose');
      const input=compose?.querySelector('textarea');
      const developer=document.getElementById('rxFixGuidance');
      const rect=el=>el?({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}):null;
      return {menu:rect(menu),navHidden:!!nav?.hidden||getComputedStyle(nav).display==='none',chat:rect(chat),compose:rect(compose),input:rect(input),developerHidden:!!developer&&!developer.getClientRects().length,viewport:innerWidth,documentWidth:document.documentElement.scrollWidth};
    });
    record('RX UI: menu kategorii domyślnie zamknięte',visual.navHidden,JSON.stringify(visual));
    record('RX UI: czat i pole pisania bez ogromnej pustki',!!visual.chat&&!!visual.compose&&visual.compose.top-visual.chat.top<750,JSON.stringify(visual));
    record('RX UI: Developer poza ekranem czatu',visual.developerHidden,JSON.stringify(visual));
    record('RX UI: pole pisania mieści się na telefonie',!!visual.input&&visual.input.width>=180&&visual.documentWidth<=visual.viewport+2,JSON.stringify(visual));
    await page.screenshot({path:path.join(reportDir,'rx-chat-mobile-start.png'),fullPage:true});
    await page.locator('.rx-menu-toggle').click();
    record('RX UI: kategorie otwierają się na żądanie',await page.locator('.rx-side').isVisible());
    await openRxTab('🧰 RX Developer');
    record('RX UI: Developer otwiera właściwy panel',await page.locator('#rxFixGuidance').first().isVisible());
    await openRxTab('👑 Królowa BIBI — czat');
    record('RX UI: powrót do czatu zamyka menu',await page.locator('.rx-chat').isVisible()&&!(await page.locator('.rx-side').isVisible()));
    await page.screenshot({ path: path.join(reportDir, 'rx-bibi-mobile.png'), fullPage: true });
    await openRxTab('📚 Historia');
    for (const label of ['Wszystkie', 'Błędy', 'W toku', 'Udane']) {
      const button = page.locator('nav[aria-label="Filtr historii"] button').filter({hasText:label});
      const exists = await button.count() > 0;
      if (exists) await button.evaluate(el=>el.click());
      record('Filtr ' + label, exists && await button.getAttribute('aria-pressed') === 'true');
    }
    const refresh = page.getByRole('button', { name: 'Odśwież historię' });
    await refresh.evaluate(el=>el.click());
    record('Odśwież historię', await refresh.count() === 1);
    const guardLink = page.locator('a[href="/guard-lab.html"]').filter({hasText:'RX Strażak'});
    record('Link RX Strażak', await guardLink.count() > 0);
    const guard = await browser.newPage({ ...devices['Pixel 7'] });
    // The guard page also reads GitHub's public API; use the same short-lived
    // runner-side proxy as the manager to avoid unauthenticated rate limits.
    if(process.env.GITHUB_TOKEN){
      await guard.route(/^https:\/\/api\.github\.com\//,async route=>{
        try{
          const original=route.request();
          const upstream=await fetch(original.url(),{
            method:original.method(),
            headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+process.env.GITHUB_TOKEN,'X-GitHub-Api-Version':'2022-11-28'},
            signal:AbortSignal.timeout(15000)
          });
          await route.fulfill({status:upstream.status,contentType:upstream.headers.get('content-type')||'application/json',body:await upstream.text(),headers:{'access-control-allow-origin':'*','cache-control':'no-store'}});
        }catch(err){console.error('RX Guard GitHub API proxy:',err.message);await route.abort();}
      });
    }
    watch(guard, 'RX Strażak', guardErrors);
    const guardResponse = await guard.goto(base + '/guard-lab.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    record('RX Strażak HTTP', guardResponse && guardResponse.status() === 200);
    record('RX Strażak nagłówek', await guard.getByRole('heading', { name: /Strażak/ }).count() > 0);
    await guard.screenshot({ path: path.join(reportDir, 'rx-strazak-mobile.png'), fullPage: true });
    // Queen's real mobile layout audit: browser measurements, not a simulated status.
    const layout=await guard.evaluate(()=>{
      const box=selector=>{const el=document.querySelector(selector);if(!el)return null;const r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height),visible:getComputedStyle(el).display!=='none'};};
      return {viewport:innerHeight,catalog:box('#rxProgramsCatalog'),hero:box('.rx-bibi-hero'),chat:box('#guardPanelChat'),composer:box('#guardChatForm'),programsCollapsed:!!document.querySelector('#rxProgramsList details:not([open])'),documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
    });
    record('RX QUEEN — katalog programów zwinięty na telefonie',layout.programsCollapsed,JSON.stringify(layout));
    record('RX QUEEN — Strażak nad katalogiem programów',!!layout.hero&&!!layout.catalog&&layout.hero.top<layout.catalog.top,JSON.stringify(layout));
    record('RX QUEEN — brak poziomego przewijania panelu',layout.documentWidth<=layout.viewportWidth+2,JSON.stringify(layout));
    fs.writeFileSync(path.join(reportDir,'rx-queen-live-layout.json'),JSON.stringify({schema:1,kind:'rx-queen-mobile-layout',url:base+'/guard-lab.html',observedAt:new Date().toISOString(),...layout},null,2)+'\n');
    const guardTabs=guard.getByRole('tab');
    record('RX Strażak — cztery zakładki',await guardTabs.count()===4);
    const devTab=guard.getByRole('tab',{name:/Developer/});
    await devTab.click();
    record('RX Strażak — Developer otwiera panel',await devTab.getAttribute('aria-selected')==='true'&&await guard.locator('#guardPanelDeveloper').isVisible());
    const moderationTab=guard.getByRole('tab',{name:/Moderacja/});
    await moderationTab.click();
    record('RX Strażak — Moderacja otwiera panel',await moderationTab.getAttribute('aria-selected')==='true'&&await guard.locator('#guardPanelModeration').isVisible());
    const chatTab=guard.getByRole('tab',{name:/Czat/});
    await chatTab.click();
    record('RX Strażak — powrót do czatu',await chatTab.getAttribute('aria-selected')==='true'&&await guard.locator('#guardPanelChat').isVisible());
    const chatInput=guard.getByRole('textbox',{name:'Wpisz polecenie'});
    await chatInput.fill('pomoc');
    await guard.locator('#guardChatForm').getByRole('button',{name:'Wyślij'}).click();
    record('RX Strażak — czat odpowiada na pomoc',await guard.locator('#guardChatMessages').getByText('Strażak:',{exact:false}).count()>0&&await guard.locator('#guardChatMessages .guard-chat-message').count()>1);
    const exitFullscreen=guard.getByRole('button',{name:'Zamknij pełnoekranowy czat'});
    if(await exitFullscreen.isVisible())await exitFullscreen.click();
    await moderationTab.click();
    await guard.locator('#t').fill('Sprzedam rower');
    await guard.locator('#d').fill('Rower używany, odbiór osobisty.');
    await guard.locator('#f').getByRole('button',{name:'Sprawdź tekst'}).click();
    record('RX Strażak — bezpieczne ogłoszenie',/WYNIK: 0\/100/.test(await guard.locator('#out').innerText()));
    await guard.locator('#d').fill('Wyślij mi hasło do konta.');
    await guard.locator('#f').getByRole('button',{name:'Sprawdź tekst'}).click();
    record('RX Strażak — wykrywa prośbę o hasło',(await guard.locator('#out').innerText()).includes('DO KONTROLI MODERATORA'));
    await guard.locator('#guardRxTitle').fill('Sprzedam rower');
    await guard.locator('#guardRxDescription').fill('Rower używany, odbiór osobisty.');
    await guard.locator('#guardRxForm').getByRole('button',{name:'Analizuj silnikiem RX'}).click();
    record('RX Strażak — formularz silnika RX daje wynik',(await guard.locator('#guardRxResult').innerText()).length>40);


    // RX Admin on Android: public shell and secure gate only; never bypass admin login.
    try {
      const admin=await browser.newPage({...devices['Pixel 7'],locale:'pl-PL'});
      const adminErrors=[];
      admin.on('pageerror',error=>adminErrors.push(error.message));
      const adminResponse=await admin.goto(base+'/rx-admin-prototype.html',{waitUntil:'domcontentloaded',timeout:30000});
      record('RX Admin Android — HTTP 200',adminResponse?.status()===200,String(adminResponse?.status()));
      record('RX Admin Android — brama dostępu',await admin.locator('#rxGate').count()===1);
      record('RX Admin Android — aplikacja domyślnie ukryta',await admin.locator('#rxApp').isHidden());
      for(const id of ['rxAdminCloudCheck','rxAntQueueRefresh','rxCheckChat','rxRunApprovedTests','rxWorkbench']){
        record('RX Admin Android — moduł '+id,await admin.locator('#'+id).count()===1);
      }
      record('RX Admin Android — bez błędów składni JS',adminErrors.length===0,adminErrors.join('; '));
      // Never create an admin account or bypass authorization. Optional existing session only.
      if(process.env.RX_ADMIN_STORAGE_STATE){
        try{
          const statePath=path.resolve(process.env.RX_ADMIN_STORAGE_STATE);
          if(!fs.existsSync(statePath))throw Error('Brak pliku istniejącej sesji administratora');
          const authorized=await browser.newContext({...devices['Pixel 7'],locale:'pl-PL',storageState:statePath});
          const adminPage=await authorized.newPage();
          await adminPage.goto(base+'/rx-admin-prototype.html',{waitUntil:'domcontentloaded',timeout:30000});
          await adminPage.locator('#rxApp').waitFor({state:'visible',timeout:15000});
          await adminPage.locator('#rxCheckChat').click();
          await adminPage.waitForFunction(()=>{const e=document.getElementById('rxCheckChatResult');return e&&!e.textContent.includes('Sprawdzam zalogowany czat')&&e.textContent.trim().length>0},{timeout:22000});
          const chatResult=await adminPage.locator('#rxCheckChatResult').innerText();
          record('RX Admin sesja — prawdziwa odpowiedź czatu',/działa|połącz|odpowied|gotow/i.test(chatResult)&&!/błąd|brak|nie działa|niedostępn/i.test(chatResult),chatResult.slice(0,250));
          await adminPage.locator('#rxAntQueueRefresh').click();
          record('RX Admin sesja — kolejka mrówek reaguje',await adminPage.locator('#rxApp').isVisible());
          await authorized.close();
        }catch(error){record('RX Admin sesja — test czatu i mrówek',false,error.message);}
      }else{
        record('RX Admin sesja — test czatu i mrówek',true,'NIEURUCHOMIONY: brak bezpiecznie dostarczonej istniejącej sesji administratora; nie potwierdza działania czatu.');
      }
      await admin.close();
    }catch(error){record('RX Admin Android — audyt bramy i modułów',false,error.message);}
    record('Błędy JS RX BIBI', jsErrors.length === 0, jsErrors.join('; '));
    record('Błędy JS RX Strażak', guardErrors.length === 0, guardErrors.join('; '));
    for (const [label, target] of [['RX BIBI', page], ['RX Strażak', guard]]) {
      const width = await target.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      record('Brak poziomego przewijania ' + label, width.content <= width.viewport + 2, JSON.stringify(width));
    }
    record('Diagnostyka konsoli i sieci', diagnostics.length === 0, diagnostics.slice(0, 20).join('; ') + (diagnostics.length > 20 ? ' (więcej: ' + diagnostics.length + ')' : ''));
    await guard.close();
    await page.close();
    activePage = null;
  } catch (error) {
    record('Wyjątek testu', false, error.stack || error.message);
    logIncident('RX BIBI Tester', 'exception', error.stack || error.message);
    if (activePage && !activePage.isClosed()) {
      try { await activePage.screenshot({ path: path.join(reportDir, 'rx-bibi-error.png'), fullPage: true, timeout: 10000 }); }
      catch (screenshotError) { logIncident('RX BIBI Tester', 'screenshot', screenshotError.message); }
    }
  } finally {
    await browser.close();
  }
  const output = { timestamp: new Date().toISOString(), base, results, passed: results.every(x => x.passed) };
  // Group failed checks into actionable areas and compare with an optional previous report.
  const classify = name => /przewijania|szeroko|mieści|menu kategorii|RX UI:/.test(name) ? 'Panel mobilny' :
    /eksport|download|kopiowanie/.test(name) ? 'Eksport i pobieranie' :
    /Filtr |histori|Odśwież/.test(name) ? 'Historia i filtry' :
    /PhotoMotion|Studio/.test(name) ? 'AI Studio' :
    /Strażak|Developer|Nawigacja|Odnośniki|Link RX/.test(name) ? 'Nawigacja RX' : 'Pozostałe';
  const failures = results.filter(item => !item.passed);
  const grouped = Object.entries(Object.groupBy ? Object.groupBy(failures, item => classify(item.name)) :
    failures.reduce((groups,item)=>{(groups[classify(item.name)] ||= []).push(item);return groups;},{}))
    .map(([area,items])=>({area,count:items.length,tests:items.map(item=>({name:item.name,detail:item.detail}))}))
    .sort((a,b)=>b.count-a.count);
  let comparison = {available:false,reason:'Brak raportu poprzedniego przebiegu'};
  const previousPath = process.env.RX_PREVIOUS_REPORT;
  if(previousPath && fs.existsSync(previousPath)){
    try {
      const previous = JSON.parse(fs.readFileSync(previousPath,'utf8'));
      const oldFailed = new Set((previous.results||[]).filter(item=>!item.passed).map(item=>item.name));
      const nowFailed = new Set(failures.map(item=>item.name));
      comparison = {available:true, fixed:[...oldFailed].filter(name=>!nowFailed.has(name)),
        newFailures:[...nowFailed].filter(name=>!oldFailed.has(name)),
        recurring:[...nowFailed].filter(name=>oldFailed.has(name))};
    } catch(error){comparison={available:false,reason:'Nie można odczytać poprzedniego raportu: '+error.message};}
  }
  fs.writeFileSync(path.join(reportDir,'failure-groups.json'),JSON.stringify({
    timestamp:new Date().toISOString(),total:results.length,failed:failures.length,groups:grouped,comparison
  },null,2));
  console.log('RX FAILURE GROUPS:',JSON.stringify({groups:grouped.map(g=>({area:g.area,count:g.count,names:g.tests.map(t=>t.name)})),comparison}));
  fs.writeFileSync(path.join(reportDir, 'incidents.json'), JSON.stringify({ timestamp: output.timestamp, count: incidentLog.length, incidents: incidentLog }, null, 2));
  fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(output, null, 2));
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const rows=results.map(item=>'<tr><td>'+escapeHtml(item.name)+'</td><td>'+(item.passed?'OK':'BŁĄD')+'</td><td>'+escapeHtml(item.detail)+'</td></tr>').join('');
  const html='<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RX BIBI Tester — raport</title><style>body{font:16px system-ui;background:#08131f;color:#eaf7ff;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #375165;padding:10px;text-align:left;overflow-wrap:anywhere}a{color:#78e8f1}</style></head><body><h1>RX BIBI Tester — raport</h1><p>Data: '+escapeHtml(output.timestamp)+' · Wynik: '+(output.passed?'UDANY':'NIEUDANY')+'</p><table><thead><tr><th>Test</th><th>Wynik</th><th>Szczegóły</th></tr></thead><tbody>'+rows+'</tbody></table><p>Zrzuty ekranu znajdują się w tym samym archiwum.</p></body></html>';
  fs.writeFileSync(path.join(reportDir, 'report.html'), html);
  if(process.env.GITHUB_STEP_SUMMARY){
    const lines=['## RX BIBI Tester — testy Playwright','','| Test | Wynik |','|---|---|',...results.map(item=>'| '+item.name.replace(/\\|/g,'/')+' | '+(item.passed?'OK':'BŁĄD')+' |'),'','**Wynik: '+(output.passed?'UDANY':'NIEUDANY')+'**'];
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
  }

  console.log(JSON.stringify(output, null, 2));
  if (!output.passed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
