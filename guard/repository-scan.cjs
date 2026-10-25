'use strict';
// Offline, read-only scan of explicitly allowed project files. Never publishes source or secrets.
const fs=require('node:fs');
const path=require('node:path');
const {inspectSource}=require('./developer-inspector.cjs');
const FILES=['guard-chat.js','guard-code-ui.js','guard-commands.js','guard-engine-2.js','guard-task-analyzer-plugin.js','guard-lab.js','worker.js'];
function scan(root=process.cwd()){
 const files=[];let count=0;
 for(const name of FILES){
  const full=path.join(root,name);
  if(!fs.existsSync(full)){files.push({path:name,error:'missing'});continue;}
  const source=fs.readFileSync(full,'utf8');
  if(source.length>100000){files.push({path:name,error:'too_large'});continue;}
  const result=inspectSource({path:name,source});
  files.push({path:name,lines:result.lines,findings:result.findings});
  count+=result.findings.length;
 }
 return {version:1,readOnly:true,checked:files.length,signals:count,files,notice:'Heuristic signals only; not a security audit.'};
}
if(require.main===module){
 const report=scan();
 const output=path.resolve(process.cwd(),'guard-developer-report.json');
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
 console.log('Strażak Developer: checked '+report.checked+' files; '+report.signals+' signals. Report: guard-developer-report.json (CI artifact only).');
}
module.exports={scan,FILES};
