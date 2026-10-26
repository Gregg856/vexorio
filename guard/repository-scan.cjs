'use strict';
// Offline, read-only scan of explicitly allowed project files. Never publishes source or secrets.
const fs=require('node:fs');
const path=require('node:path');
const {inspectSource}=require('./developer-inspector.cjs');
const FILES=['guard-chat.js','guard-code-ui.js','guard-commands.js','guard-engine-2.js','guard-task-analyzer-plugin.js','guard-lab.js','guard-lab.html','worker.js'];
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
  let dirStat;
  try{dirStat=fs.lstatSync(base);}
  catch(error){continue;}
  if(!dirStat.isDirectory()||dirStat.isSymbolicLink())continue;
  let entries;
  try{entries=fs.readdirSync(base,{withFileTypes:true});}
  catch(error){continue;}
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
   if(!entry.isFile()||!/^[-\w.]+\.(?:js|cjs|mjs)$/.test(entry.name))continue;
   names.push(directory+'/'+entry.name);
  }
 }
 return [...new Set(names)].slice(0,MAX_FILES);
}
const GENERATED_ASSETS={'guard-plugin-core.js':'guard/plugin-core.cjs','guard-developer-inspector.js':'guard/developer-inspector.cjs','guard-developer-diff.js':'guard/developer-diff.cjs'};
function checkHtmlReferences(root,source){
 const findings=[];
 for(const match of source.matchAll(/<script\b[^>]*\bsrc=["'](\/[-\w./]+(?:\?[^"']*)?)["'][^>]*>/gi)){
  const name=match[1].split('?')[0].slice(1);
  if(name.includes('..'))continue;
  const sourcePath=GENERATED_ASSETS[name]||name;
  let safeAsset=false;
  try{
   const asset=fs.lstatSync(path.join(root,sourcePath));
   safeAsset=asset.isFile()&&!asset.isSymbolicLink();
  }catch(error){safeAsset=false;}
  if(!safeAsset){
   findings.push({rule:'missing-script',severity:'high',line:source.slice(0,match.index).split('\n').length,message:'Brak lokalnego pliku skryptu: '+name});
  }
 }
 return findings;
}
function scan(root=process.cwd()){
 const files=[];let count=0;
 for(const name of listFiles(root)){
  const full=path.join(root,name);
  if(!fs.existsSync(full)){files.push({path:name,error:'missing'});continue;}
  let stat;
  try{stat=fs.lstatSync(full);}
  catch(error){files.push({path:name,error:'unreadable'});continue;}
  if(!stat.isFile()||stat.isSymbolicLink()){files.push({path:name,error:'unsafe_file_type'});continue;}
  if(stat.size>400000){files.push({path:name,error:'too_large'});continue;}
  let source;
  try{source=fs.readFileSync(full,'utf8');}
  catch(error){files.push({path:name,error:'unreadable'});continue;}
  if(source.length>100000){files.push({path:name,error:'too_large'});continue;}
  const result=inspectSource({path:name,source});
  if(name==='guard-lab.html')result.findings.push(...checkHtmlReferences(root,source));
  const syntax=checkSyntax(full);
  if(syntax)result.findings.push(syntax);
  result.findings.sort((a,b)=>({high:0,medium:1,low:2}[a.severity]??3)-({high:0,medium:1,low:2}[b.severity]??3)||a.line-b.line||a.rule.localeCompare(b.rule));
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
module.exports={scan,FILES,listFiles,MAX_FILES,checkHtmlReferences,GENERATED_ASSETS};
