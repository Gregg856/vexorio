'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {scan,FILES,listFiles}=require('../guard/repository-scan.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'guard-scan-'));
try{
 fs.writeFileSync(path.join(dir,'guard-chat.js'),'eval(x);\nconsole.log(x);');
 const report=scan(dir);
 assert.equal(report.readOnly,true);
 assert.equal(report.checked,FILES.length);
 fs.writeFileSync(path.join(dir,'guard-lab.html'),'<script src="/missing-script.js" defer></script>');
 const missingScript=scan(dir).files.find(f=>f.path==='guard-lab.html');
 assert.ok(missingScript.findings.some(f=>f.rule==='missing-script'&&f.severity==='high'));
 fs.writeFileSync(path.join(dir,'missing-script.js'),'const ok=1;');
 assert.equal(scan(dir).files.find(f=>f.path==='guard-lab.html').findings.length,0);
 fs.writeFileSync(path.join(dir,'guard-lab.html'),'<script src="/guard-developer-inspector.js"></script>');
 fs.mkdirSync(path.join(dir,'guard'));
 fs.writeFileSync(path.join(dir,'guard','developer-inspector.cjs'),'const inspect=1;');
 assert.equal(scan(dir).files.find(f=>f.path==='guard-lab.html').findings.length,0,'generated browser asset should resolve to its source');
 fs.mkdirSync(path.join(dir,'tests'));
 fs.writeFileSync(path.join(dir,'guard','helper.cjs'),'const x=1;');
 fs.writeFileSync(path.join(dir,'tests','example.test.cjs'),'const x=1;');
 fs.writeFileSync(path.join(dir,'guard','ignored.txt'),'secret');
 fs.mkdirSync(path.join(dir,'guard','nested'));
 fs.writeFileSync(path.join(dir,'guard','nested','skip.js'),'eval(x)');
 const names=listFiles(dir);
 assert.ok(names.includes('guard/helper.cjs'));
 assert.ok(names.includes('tests/example.test.cjs'));
 assert.ok(!names.includes('guard/ignored.txt'));
 assert.ok(!names.includes('guard/nested/skip.js'));
 assert.equal(scan(dir).checked,FILES.length+3);
 fs.writeFileSync(path.join(dir,'guard','broken.js'),'function ( {');
 const syntaxReport=scan(dir);
 assert.ok(syntaxReport.files.find(f=>f.path==='guard/broken.js').findings.some(f=>f.rule==='syntax-error'&&f.severity==='high'));
 assert.ok(!syntaxReport.files.find(f=>f.path==='guard/helper.cjs').findings.some(f=>f.rule==='syntax-error'));
 const external=fs.mkdtempSync(path.join(os.tmpdir(),'guard-outside-'));
 try{
  fs.writeFileSync(path.join(external,'outside.js'),'eval(secret);');
  fs.symlinkSync(path.join(external,'outside.js'),path.join(dir,'guard-code-ui.js'));
  const symlinkResult=scan(dir).files.find(f=>f.path==='guard-code-ui.js');
  assert.equal(symlinkResult.error,'unsafe_file_type');
  assert.equal(symlinkResult.findings,undefined);
  fs.unlinkSync(path.join(dir,'guard-code-ui.js'));
 }finally{fs.rmSync(external,{recursive:true,force:true});}
 const linkedRoot=fs.mkdtempSync(path.join(os.tmpdir(),'guard-linked-root-'));
 try{
  fs.symlinkSync(path.join(dir,'guard'),path.join(linkedRoot,'guard'),'dir');
  const linkedNames=listFiles(linkedRoot);
  assert.ok(!linkedNames.some(name=>name.startsWith('guard/')),'symlinked directories must not be traversed');
  const linkedScan=scan(linkedRoot);
  assert.ok(!linkedScan.files.some(f=>f.path.startsWith('guard/')),'symlinked directories must not be scanned');
 }finally{fs.rmSync(linkedRoot,{recursive:true,force:true});}
 assert.equal(report.signals,2);
 assert.deepEqual(report.files[0].findings.map(x=>x.rule),['eval','console-log']);
 assert.equal(report.files[1].error,'missing');
 assert.equal(fs.readdirSync(dir).length,5,'scanner must not create files');
 console.log('PASS: read-only repository scanner, allowlist, missing files and detection');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
