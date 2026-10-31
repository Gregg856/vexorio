'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {applyApprovedMemory}=require('../rx-queen-live-memory-gate.cjs');
const {approve,save}=require('../rx-queen-approved-memory.cjs');
async function fixture(fn){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-queen-gate-'));const file=path.join(dir,'memory.json');
 try{await save(file,approve({schema:1,kind:'rx-queen-approved-responses',entries:[]},{prompt:'Cześć',answer:'Witaj od Królowej!',reviewId:'review-42',approved:true}));await fn(file);}
 finally{await fs.rm(dir,{recursive:true,force:true});}
}
const reply=(status=200,ok=true)=>new Response(JSON.stringify({ok,answer:'Odpowiedź oryginalna',requestId:'abc'}),{status,headers:{'content-type':'application/json',etag:'stale','content-length':'100'}});
test('authenticated success reads approved answer and preserves metadata',()=>fixture(async file=>{
 const r=await applyApprovedMemory({response:reply(),message:'cześć',enabled:true,file});
 const body=await r.json();assert.equal(body.answer,'Witaj od Królowej!');assert.equal(body.requestId,'abc');assert.equal(body.reviewId,'review-42');assert.equal(r.headers.get('etag'),null);assert.equal(r.headers.get('cache-control'),'no-store');
}));
test('unauthenticated worker rejection cannot be overridden',()=>fixture(async file=>{
 const r=await applyApprovedMemory({response:reply(401,false),message:'Cześć',enabled:true,file});
 assert.equal(r.status,401);assert.equal((await r.json()).answer,'Odpowiedź oryginalna');
}));
test('worker ok=false cannot be overridden',()=>fixture(async file=>{
 const r=await applyApprovedMemory({response:reply(200,false),message:'Cześć',enabled:true,file});
 assert.equal((await r.json()).answer,'Odpowiedź oryginalna');
}));
test('disabled gate and unmatched prompt retain worker answer',()=>fixture(async file=>{
 for(const args of [{enabled:false,message:'Cześć'},{enabled:true,message:'Inne pytanie'}]){
  const r=await applyApprovedMemory({response:reply(),file,...args});
  assert.equal((await r.json()).answer,'Odpowiedź oryginalna');
 }
}));
test('corrupt memory never changes worker response',()=>fixture(async file=>{
 await fs.writeFile(file,'broken');const r=await applyApprovedMemory({response:reply(),message:'Cześć',enabled:true,file});
 assert.equal((await r.json()).answer,'Odpowiedź oryginalna');
}));
test('long prompt cannot trigger memory override',()=>fixture(async file=>{
 const r=await applyApprovedMemory({response:reply(),message:'a'.repeat(161),enabled:true,file});
 assert.equal((await r.json()).answer,'Odpowiedź oryginalna');
}));
