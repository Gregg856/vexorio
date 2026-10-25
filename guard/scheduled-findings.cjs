'use strict';
const fs=require('node:fs');
const {inspectSource}=require('./developer-inspector.cjs');
const files=['guard-chat.js','guard-github-panel.js','guard-code-ui.js','guard-code-fix.js'];
const lines=['Strażak — automatyczny audyt reguł bezpieczeństwa','Analiza statyczna, tylko do odczytu.'];
const totals={high:0,medium:0,low:0};
for(const file of files){
 const source=fs.readFileSync(file,'utf8');
 const report=inspectSource({path:file,source});
 lines.push('\nPLIK: '+file+' | Wykryte sygnały: '+report.findings.length+(report.limited?' (limit 50)':''));
 for(const finding of report.findings){
  totals[finding.severity]=(totals[finding.severity]||0)+1;
  lines.push('Linia '+finding.line+' ['+finding.severity+'] '+finding.rule+': '+finding.message);
 }
 if(!report.findings.length)lines.push('Brak sygnałów w aktualnych regułach.');
}
lines.push('\nPODSUMOWANIE: high='+totals.high+', medium='+totals.medium+', low='+totals.low);
lines.push('Wyniki są wskazówkami, nie potwierdzonymi podatnościami. Niczego nie zmieniono.');
fs.writeFileSync('strazak-security-findings.txt',lines.join('\n')+'\n',{mode:0o600});
console.log(lines.slice(-2).join('\n'));
