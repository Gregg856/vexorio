'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {scan,FILES}=require('../guard/repository-scan.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'guard-scan-'));
try{
 fs.writeFileSync(path.join(dir,'guard-chat.js'),'eval(x);\nconsole.log(x);');
 const report=scan(dir);
 assert.equal(report.readOnly,true);
 assert.equal(report.checked,FILES.length);
 assert.equal(report.signals,2);
 assert.deepEqual(report.files[0].findings.map(x=>x.rule),['eval','console-log']);
 assert.equal(report.files[1].error,'missing');
 assert.equal(fs.readdirSync(dir).length,1,'scanner must not write files');
 console.log('PASS: read-only repository scanner, allowlist, missing files and detection');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
