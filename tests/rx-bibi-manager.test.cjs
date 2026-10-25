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
assert.ok(bibi.includes("'/jobs?per_page=30'"),'RX BIBI must inspect GitHub jobs for failed runs');
assert.ok(bibi.includes("s.conclusion==='failure'"),'RX BIBI must only report failed steps');
assert.ok(bibi.includes('Diagnoza niedostępna'),'RX BIBI must disclose unavailable diagnosis');
assert.ok(bibi.includes('inspectedFailures>=3'),'RX BIBI must limit failed-run API diagnostics');
assert.ok(bibi.includes('Limit GitHub API'),'RX BIBI must identify rate limiting');
assert.ok(bibi.includes('Historia GitHub Actions niedostępna'),'RX BIBI must identify unavailable history');
assert.ok(bibi.includes('Sprawdź komunikat testu'),'RX BIBI must recommend inspecting failed tests');
assert.ok(bibi.includes('nie ponawiaj bez analizy'),'RX BIBI must not suggest blind deployment retries');
assert.ok(bibi.includes("r.name==='Deploy VEXORIO'&&r.head_branch==='main'"),'Latest deployment must use production branch');
assert.ok(bibi.includes("'Data: '+(run.created_at"),'RX BIBI must format run dates correctly');
console.log('PASS: RX BIBI Manager 1.0 read-only deployment recommendations');
