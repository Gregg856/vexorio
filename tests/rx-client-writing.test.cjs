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
