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
  try {
    const page = await browser.newPage({ ...devices['Pixel 7'], locale: 'pl-PL' });
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));
    const response = await page.goto(base + '/rx-bibi-manager.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    record('RX BIBI HTTP', response && response.status() === 200, response && response.status());
    record('Nagłówek RX BIBI', await page.getByRole('heading', { name: /RX BIBI Manager 1\.3/ }).count() > 0);
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
    const guardResponse = await guard.goto(base + '/guard-lab.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    record('RX Strażak HTTP', guardResponse && guardResponse.status() === 200);
    record('RX Strażak nagłówek', await guard.getByRole('heading', { name: /Strażak/ }).count() > 0);
    await guard.screenshot({ path: path.join(reportDir, 'rx-strazak-mobile.png'), fullPage: true });
    record('Błędy JS RX BIBI', jsErrors.length === 0, jsErrors.join('; '));
    await guard.close();
    await page.close();
  } catch (error) {
    record('Wyjątek testu', false, error.stack || error.message);
  } finally {
    await browser.close();
  }
  const output = { timestamp: new Date().toISOString(), base, results, passed: results.every(x => x.passed) };
  fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
  if (!output.passed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
