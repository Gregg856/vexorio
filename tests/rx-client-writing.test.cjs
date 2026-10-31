'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
test('client writing handles compatible and conflicting instructions',async()=>{
 const {composeClientWriting:compose}=await import(pathToFileURL(path.join(__dirname,'..','rx-client-writing.mjs')));
 assert.equal(compose('Napisz krótko, bez powitania i bez pożegnania: spotkanie jutro.').answer,'Spotkanie jutro.');
 const conflict=compose('Odpowiedz bez pożegnania, dodaj pożegnanie: plik dotarł.');
 assert.equal(conflict.requiresClarification,true);
 assert.match(conflict.answer,/sprzeczne/);
 assert.equal(compose('status'),null);
 assert.equal(compose('Napisz wiadomość: potwierdzam termin.').answer,'Cześć! Potwierdzam termin. Pozdrawiam!');
 assert.equal(compose('Napisz wiadomość z nieznaną opcją: test'),null);
});
test('server route invokes writing only after authenticated user validation',()=>{
 const worker=fs.readFileSync(path.join(__dirname,'..','worker.js'),'utf8');
 const start=worker.indexOf("if(url.pathname==='/api/rx/client/chat')");
 const auth=worker.indexOf('if(!user?.id||user.is_anonymous===true)',start);
 const invoke=worker.indexOf('const writing=composeClientWriting(message)',start);
 assert.ok(start>=0&&auth>start&&invoke>auth);
 assert.ok(worker.includes("await import('./rx-client-writing.mjs')"));
});

test('client writing preserves the meaning of question and exclamation punctuation',async()=>{
 const {pathToFileURL}=require('node:url');
 const {composeClientWriting}=await import(pathToFileURL(path.join(__dirname,'..','rx-client-writing.mjs')));
 const examples=[
  ['Napisz krótko: czy spotkanie jest jutro?','Czy spotkanie jest jutro?'],
  ['Napisz krótko: dziękuję!','Dziękuję!'],
  ['Napisz krótko: czy to działa?!','Czy to działa?!'],
  ['Napisz krótko: wszystko gotowe','Wszystko gotowe.']
 ];
 for(const [prompt,expected] of examples)assert.equal(composeClientWriting(prompt)?.answer,expected,prompt);
});

test('additional Polish verbs compose safe client writing replies',async()=>{
 const {pathToFileURL}=require('node:url');
 const {composeClientWriting}=await import(pathToFileURL(path.join(__dirname,'..','rx-client-writing.mjs')));
 for(const verb of ['Sformułuj','Sformuluj','Stwórz','Stworz']){
  const result=composeClientWriting(verb+' krótko: spotkanie jutro');
  assert.equal(result?.answer,'Spotkanie jutro.',verb);
 }
});

test('polite Polish writing requests are understood',async()=>{
 const {pathToFileURL}=require('node:url');
 const {composeClientWriting}=await import(pathToFileURL(path.join(__dirname,'..','rx-client-writing.mjs')));
 for(const prompt of ['Proszę napisz krótko: spotkanie jutro','Prosze sformuluj krotko: spotkanie jutro']){
  assert.equal(composeClientWriting(prompt)?.answer,'Spotkanie jutro.',prompt);
 }
});

test('signature options and contradictory signature instructions',async()=>{
 const {composeClientWriting:compose}=await import(pathToFileURL(path.join(__dirname,'..','rx-client-writing.mjs')));
 assert.equal(compose('Napisz bez podpisu: potwierdzam termin').answer,'Cześć! Potwierdzam termin.');
 assert.equal(compose('Napisz z podpisem: potwierdzam termin').answer,'Cześć! Potwierdzam termin. Pozdrawiam!');
 assert.equal(compose('Napisz dodaj podpis: potwierdzam termin').answer,'Cześć! Potwierdzam termin. Pozdrawiam!');
 const conflict=compose('Napisz bez podpisu, dodaj podpis: potwierdzam termin');
 assert.equal(conflict?.requiresClarification,true);
 assert.match(conflict.answer,/sprzeczne/);
});

test('formal and informal tone with conflict checks',async()=>{
 const {composeClientWriting:compose}=await import(pathToFileURL(path.join(__dirname,'..','rx-client-writing.mjs')));
 assert.equal(compose('Napisz formalnie: potwierdzam termin').answer,'Dzień dobry! Potwierdzam termin. Z poważaniem!');
 assert.equal(compose('Napisz oficjalnie, bez powitania: potwierdzam termin').answer,'Potwierdzam termin. Z poważaniem!');
 assert.equal(compose('Napisz nieformalnie: potwierdzam termin').answer,'Cześć! Potwierdzam termin. Pozdrawiam!');
 const conflict=compose('Napisz formalnie i nieformalnie: potwierdzam termin');
 assert.equal(conflict?.requiresClarification,true);
 assert.match(conflict.answer,/styl/);
});
