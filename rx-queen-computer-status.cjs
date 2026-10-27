'use strict';
// RX QUEEN STATUS: summarize actual local RX test report, without invented cloud state.
const fs=require('node:fs');
const path=require('node:path');
function summarizeRX(report){
 if(!report||report.schema!==1||report.kind!=='rx-mega-cloud-computer'||!Array.isArray(report.checks)||report.checks.length>100||!report.checks.every(x=>x&&typeof x.file==='string'&&['passed','failed','planned'].includes(x.status)))throw Error('Invalid RX report');
 const passed=report.checks.filter(x=>x.status==='passed').length;
 const failed=report.checks.filter(x=>x.status==='failed').length;
 const planned=report.checks.filter(x=>x.status==='planned').length;
 const issues=report.checks.filter(x=>x.status==='failed').map(x=>({component:x.file,priority:'high',action:'inspect_test_logs'}));
 return {schema:1,kind:'rx-queen-computer-status',state:failed?'needs_attention':planned?'pending':'checks_passed',passed,failed,planned,issues,cloudServerProvisioned:report.cloudServerProvisioned===true,experiments:{colliderSimulation:!!report.labs?.collider,higgsSynthetic:report.labs?.higgs?.realCERNData===false,solarEstimate:!!report.labs?.energy},note:'Based on local report only. Checks passed does not prove all VEXORIO features work; no external CI status fetched.'};
}
if(require.main===module){
 const source=path.join('rx-bibi-reports','rx-mega-cloud-computer.json');
 const report=summarizeRX(JSON.parse(fs.readFileSync(source,'utf8')));
 const out=path.join('rx-bibi-reports','rx-queen-computer-status.json');
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 const lines=['## RX QUEEN — komputer w chmurze','- Stan: **'+report.state+'**','- Testy RX: '+report.passed+' OK, '+report.failed+' błędów, '+report.planned+' oczekuje','- Rzeczywisty własny serwer VM: '+(report.cloudServerProvisioned?'tak':'nie'),' - Laboratoria: symulacja pierścienia, syntetyczne dane Higgsa, szacunki energii'];
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
 console.log('RX QUEEN:',report.state);
}
module.exports={summarizeRX};
