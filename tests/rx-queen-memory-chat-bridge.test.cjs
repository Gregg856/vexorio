'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {chatRX,chatRXWithApprovedResponses}=require('../rx-brain-chat-engine.cjs');
const {approve,save}=require('../rx-queen-approved-memory.cjs');
test('approved answer is used only for exact prompt',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-queen-approved-'));const file=path.join(dir,'approved.json');
 try{
  const data=approve({schema:1,kind:'rx-queen-approved-responses',entries:[]},{prompt:'cześć królowo',answer:'Witaj, jestem BIBI!',reviewId:'review-123',approved:true});
  await save(file,data);
  const hit=await chatRXWithApprovedResponses('cześć królowo',{approvedFile:file});
  assert.equal(hit.answer,'Witaj, jestem BIBI!');assert.equal(hit.approvedResponse,true);assert.equal(hit.executed,0);
  const miss=await chatRXWithApprovedResponses('dzień dobry',{approvedFile:file});
  assert.equal(miss.answer,chatRX('dzień dobry').answer);assert.equal(miss.approvedResponse,undefined);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('missing approved store falls back to original chat',async()=>{
 const file=path.join(os.tmpdir(),'rx-queen-nonexistent-'+process.pid+'-memory.json');
 const result=await chatRXWithApprovedResponses('cześć',{approvedFile:file});
 assert.equal(result.answer,chatRX('cześć').answer);
});
test('invalid memory path is rejected',async()=>{await assert.rejects(chatRXWithApprovedResponses('cześć',{approvedFile:''}));});

test('reviewed exercise reaches chat only after explicit approval and survives reload',async()=>{
 const {approveWritingExercise,load,lookup}=require('../rx-queen-approved-memory.cjs');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-queen-lesson-'));const file=path.join(dir,'approved.json');
 const exercise={mode:'message',prompt:'miłego dnia',text:'Miłego dnia!',productionConnected:false};
 const prompt='Napisz wiadomość: miłego dnia';
 try{
  const empty=await load(file);
  assert.equal(lookup(empty,prompt),null,'An exercise alone must not enter memory');
  assert.throws(()=>approveWritingExercise(empty,{exercise,reviewId:'lesson-663',approved:false}),/approval/i);
  const reviewed=approveWritingExercise(empty,{exercise,reviewId:'lesson-663',approved:true});
  await save(file,reviewed);
  const restored=await load(file);
  assert.equal(lookup(restored,prompt)?.answer,'Miłego dnia!');
  const hit=await chatRXWithApprovedResponses(prompt,{approvedFile:file});
  assert.equal(hit.answer,'Miłego dnia!');
  assert.equal(hit.approvedResponse,true);
  assert.equal(hit.executed,0);
  const miss=await chatRXWithApprovedResponses('Napisz wiadomość: inna treść',{approvedFile:file});
  assert.equal(miss.approvedResponse,undefined);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
