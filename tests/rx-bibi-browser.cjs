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
    record('Historia napraw na telefonie',await page.getByRole('region',{name:'Historia rozwiązanych problemów'}).count()===1);
    const mobileLinks=await toolCenter.getByRole('link').count();
    record('Nawigacja narzędzi RX',mobileLinks>=4,'Liczba linków: '+mobileLinks);
    const navigation=await toolCenter.locator('a[href^="#"]').evaluateAll(links=>links.map(link=>({href:link.getAttribute('href'),exists:!!document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)))})));
    record('Odnośniki do sekcji RX działają',navigation.length>0&&navigation.every(link=>link.exists),JSON.stringify(navigation));
    const tapTargets=await toolCenter.locator('nav a').evaluateAll(links=>links.map(link=>({text:link.textContent.trim(),width:Math.round(link.getBoundingClientRect().width),height:Math.round(link.getBoundingClientRect().height)})));
    record('Przyciski narzędzi RX mieszczą się na telefonie',tapTargets.length>=3&&tapTargets.every(item=>item.width>=44&&item.height>=24),JSON.stringify(tapTargets));
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
