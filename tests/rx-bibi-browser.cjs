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
    record('Nagłówek RX BIBI', await page.getByRole('heading', { name: /RX BIBI Manager 1\.3/ }).count() > 0);
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
    const toolCenter=page.getByRole('region',{name:'Centrum narzędzi RX'});
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

    const exportButton=page.getByRole('button',{name:/Pobierz raport JSON/});
    record('RX BIBI 1.7 przycisk eksportu',await exportButton.count()===1);
    try {
      await page.getByText(/RX BIBI 1.7 · Raport gotowy:/).waitFor({state:'visible',timeout:15000});
      record('RX BIBI 1.7 eksport gotowy',await exportButton.isEnabled());
      const downloadPromise=page.waitForEvent('download',{timeout:10000});
      await exportButton.click();
      const download=await downloadPromise;
      record('RX BIBI 1.7 nazwa pliku JSON',/^rx-bibi-raport-\d{4}-\d{2}-\d{2}\.json$/.test(download.suggestedFilename()),download.suggestedFilename());
      const exportShape=await page.evaluate(()=>({format:exportSnapshot?.format,hasSummary:!!exportSnapshot?.summary,hasRuns:Array.isArray(exportSnapshot?.runs),hasSecrets:JSON.stringify(exportSnapshot||{}).includes('access_token')}));
      record('RX BIBI 1.7 format danych',exportShape.format==='RX BIBI 1.7'&&exportShape.hasSummary&&exportShape.hasRuns&&!exportShape.hasSecrets,JSON.stringify(exportShape));
    }catch(error){record('RX BIBI 1.7 pobranie raportu',false,error.message);}
    try {
      await page.locator('[data-filter="failure"]').click();
      const filtered=await page.evaluate(()=>({
        filter:activeFilter,
        expected:exportSnapshot.runs.filter(r=>r.status==='completed'&&r.conclusion==='failure').length
      }));
      const filteredDownloadPromise=page.waitForEvent('download',{timeout:10000});
      await exportButton.click();
      const filteredDownload=await filteredDownloadPromise;
      const filteredPath=await filteredDownload.path();
      const fs=require('node:fs');
      const payload=JSON.parse(fs.readFileSync(filteredPath,'utf8'));
      record('RX BIBI 1.8 eksport tylko błędów',filtered.filter==='failure'&&payload.selected_filter==='failure'&&payload.runs.length===filtered.expected&&payload.runs.every(r=>r.status==='completed'&&r.conclusion==='failure')&&payload.summary.total===filtered.expected,JSON.stringify({expected:filtered.expected,actual:payload.runs.length}));
      record('RX BIBI 1.8 nazwa filtrowanego raportu',/-failure\.json$/.test(filteredDownload.suggestedFilename()),filteredDownload.suggestedFilename());
      await page.locator('[data-filter="all"]').click();
    }catch(error){record('RX BIBI 1.8 test filtrowanego eksportu',false,error.message);}
    record('Historia napraw na telefonie',await page.getByRole('region',{name:'Historia rozwiązanych problemów'}).count()===1);
    const mobileLinks=await toolCenter.getByRole('link').count();
    record('Nawigacja narzędzi RX',mobileLinks>=4,'Liczba linków: '+mobileLinks);
    const navigation=await toolCenter.locator('a[href^="#"]').evaluateAll(links=>links.map(link=>({href:link.getAttribute('href'),exists:!!document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)))})));
    record('Odnośniki do sekcji RX działają',navigation.length>0&&navigation.every(link=>link.exists),JSON.stringify(navigation));
    const tapTargets=await toolCenter.locator('nav a').evaluateAll(links=>links.map(link=>({text:link.textContent.trim(),width:Math.round(link.getBoundingClientRect().width),height:Math.round(link.getBoundingClientRect().height)})));
    record('Przyciski narzędzi RX mieszczą się na telefonie',tapTargets.length>=3&&tapTargets.every(item=>item.width>=44&&item.height>=24),JSON.stringify(tapTargets));
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
    const invalidStreaks=streakMessages.filter(s=>!/RX BIBI 2\\.0 · (ALARM: co najmniej 3 kolejne nieudane przebiegi|UWAGA: 2 kolejne nieudane przebiegi|Ostatni zakończony przebieg nieudany|Brak bieżącej serii kolejnych awarii)/.test(s)||!s.includes('to nie jest dowód wspólnej przyczyny'));
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
    await page.screenshot({ path: path.join(reportDir, 'rx-bibi-mobile.png'), fullPage: true });
    for (const label of ['Wszystkie', 'Błędy', 'W toku', 'Udane']) {
      const button = page.getByRole('button', { name: label, exact: true });
      const exists = await button.count() > 0;
      if (exists) await button.click();
      record('Filtr ' + label, exists && await button.getAttribute('aria-pressed') === 'true');
    }
    const refresh = page.getByRole('button', { name: 'Odśwież historię' });
    await refresh.click();
    record('Odśwież historię', await refresh.count() === 1);
    const guardLink = page.getByRole('link', { name: 'RX Strażak', exact: true });
    record('Link RX Strażak', await guardLink.count() > 0);
    const guard = await browser.newPage({ ...devices['Pixel 7'] });
    watch(guard, 'RX Strażak', guardErrors);
    const guardResponse = await guard.goto(base + '/guard-lab.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    record('RX Strażak HTTP', guardResponse && guardResponse.status() === 200);
    record('RX Strażak nagłówek', await guard.getByRole('heading', { name: /Strażak/ }).count() > 0);
    await guard.screenshot({ path: path.join(reportDir, 'rx-strazak-mobile.png'), fullPage: true });
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
