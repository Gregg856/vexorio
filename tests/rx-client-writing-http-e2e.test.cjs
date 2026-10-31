'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.join(__dirname,'..');
const urlFor=name=>JSON.stringify(pathToFileURL(path.join(root,name)).href);
async function loadWorker(){
 let source=fs.readFileSync(path.join(root,'worker.js'),'utf8');
 for(const name of ['rx-persistent-memory.mjs','rx-knowledge-base.mjs','rx-world-knowledge.mjs','rx-chat-planner.mjs','rx-bibi-task-reasoner.mjs']){
  source=source.replaceAll("'./"+name+"'",urlFor(name));
 }
 // The existing worker tests import source from a data URL. Dynamic imports
 // must be absolute in that environment.
 source=source.replaceAll("'./rx-client-writing.mjs'",urlFor('rx-client-writing.mjs'));
 return (await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
}
test('authenticated client writing API: actual Worker HTTP request/response, no external model',async()=>{
 const worker=await loadWorker();
 const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'public-test-key'};
 const original=global.fetch;
 let authCalls=0;
 global.fetch=async input=>{
  if(String(input).endsWith('/auth/v1/user')){authCalls++;return Response.json({id:'client-user',is_anonymous:false});}
  throw Error('Unexpected external call: '+String(input));
 };
 const send=(message,options={})=>worker.fetch(new Request('https://example.test/api/rx/client/chat',{
  method:'POST',headers:{Origin:options.origin||'https://example.test',Authorization:options.authorization===false?'':'Bearer sample.token','Content-Type':'application/json'},
  body:JSON.stringify({message})
 }),env);
 try{
  let response=await send('Napisz krótko, bez powitania i bez pożegnania: spotkanie jutro.');
  let data=await response.json();
  assert.equal(response.status,200);assert.equal(data.answer,'Spotkanie jutro.');
  assert.equal(data.writingMode,'deterministic');assert.equal(data.modelInferenceUsed,false);
  assert.equal(data.executed,0);assert.equal(data.adminToolsAvailable,false);
  response=await send('Odpowiedz bez pożegnania, dodaj pożegnanie: plik dotarł.');
  data=await response.json();assert.equal(data.requiresClarification,true);assert.match(data.answer,/sprzeczne/);
  response=await send('Napisz wiadomość: potwierdzam termin.');
  data=await response.json();assert.equal(data.answer,'Cześć! Potwierdzam termin. Pozdrawiam!');
  assert.equal(authCalls,3);
  response=await send('Napisz wiadomość: test',{authorization:false});assert.equal(response.status,401);
  response=await send('Napisz wiadomość: test',{origin:'https://evil.test'});assert.equal(response.status,403);
  assert.equal(authCalls,3);
 }finally{global.fetch=original;}
});
