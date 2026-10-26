'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createDNALineage,restoreDNALineage}=require('../rx-dna-lineage.cjs');
const {saveLineage,loadLineage}=require('../rx-dna-memory.cjs');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-dna-'));
 try{
  const store=createDNALineage();store.register({id:'RXDNA-root',approved:true,testsPassed:true});store.register({id:'RXDNA-next',parentId:'RXDNA-root',notes:'test'});
  const file=path.join(dir,'dna.json');
  await saveLineage(file,store);
  const restored=await loadLineage(file);
  assert.deepEqual(restored.snapshot(),store.snapshot());
  assert.throws(()=>restoreDNALineage({schema:1,versions:[{...store.snapshot().versions[0],depth:5}]}),/Invalid DNA depth/);
  await fs.writeFile(file,'{broken');
  await assert.rejects(()=>loadLineage(file),SyntaxError);
  console.log('PASS RX DNA memory roundtrip, tampering and corrupt JSON');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
