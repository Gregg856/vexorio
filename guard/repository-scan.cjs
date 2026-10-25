'use strict';
// Offline, read-only scan of explicitly allowed project files. Never publishes source or secrets.
const fs=require('node:fs');
const path=require('node:path');
const {inspectSource}=require('./developer-inspector.cjs');
const FILES=['guard-chat.js','guard-code-ui.js','guard-commands.js','guard-engine-2.js','guard-task-analyzer-plugin.js','guard-lab.js','worker.js'];
const DIRECTORIES=['guard','tests'];
const MAX_FILES=150;
const {execFileSync}=require('node:child_process');
function checkSyntax(file){
 if(!/\.(?:js|cjs|mjs)$/.test(file))return null;
 try{execFileSync(process.execPath,['--check',file],{stdio:'pipe',timeout:5000,maxBuffer:65536});return null;}
 catch(error){return {rule:'syntax-error',severity:'high',line:0,message:'Node.js syntax check failed (no execution).'};}
}
function listFiles(root){
 const names=[...FILES];
 for(const directory of DIRECTORIES){
  const base=path.join(root,directory);
  if(!fs.existsSync(base))continue;
  for(const entry of fs.readdirSync(base,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
   if(!entry.isFile()||!/^[-\w.]+\.(?:js|cjs|mjs)$/.test(entry.name))continue;
   names.push(directory+'/'+entry.name);
  }
 }
 return [...new Set(names)].slice(0,MAX_FILES);
}
function scan(root=process.cwd()){
 const files=[];let count=0;
 for(const name of listFiles(root)){
  const full=path.join(root,name);
  if(!fs.existsSync(full)){files.push({path:name,error:'missing'});continue;}
  const source=fs.readFileSync(full,'utf8');
  if(source.length>100000){files.push({path:name,error:'too_large'});continue;}
  const result=inspectSource({path:name,source});
  const syntax=checkSyntax(full);
  if(syntax)result.findings.push(syntax);
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
module.exports={scan,FILES,listFiles,MAX_FILES};
