'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','rx-bibi-manager.html'),'utf8');
const start=html.indexOf('  // Existing authenticated RX BIBI client bridge for writing tasks;');
const end=html.indexOf('  const taskMatch=',start);
assert.ok(start>=0&&end>start,'existing BIBI bridge must remain');
const block=html.slice(start,end);
const match=block.match(/if\(\/(.+?)\/iu\.test\(message\)\)\{/s);
assert.ok(match,'writing route must use explicit anchored regex');
const route=new RegExp(match[1],'iu');
test('combined writing constraints reach existing authenticated chat bridge',()=>{
 for(const prompt of [
  'Napisz wiadomość: spotkanie jutro.',
  'Napisz krótko, bez powitania i bez pożegnania: spotkanie jutro.',
  'Odpowiedz bez pożegnania, dodaj pożegnanie: plik dotarł.',
  'Napisz wiadomość bez powitania: potwierdzam termin.'
 ])assert.ok(route.test(prompt),prompt);
});
test('ordinary RX commands do not enter writing bridge',()=>{
 for(const prompt of ['status','sprawdź błędy','dodaj zadanie: testy','co pamiętasz o zadaniu: x'])assert.equal(route.test(prompt),false,prompt);
});
test('bridge still uses existing authenticated API and does not create a new chat',()=>{
 assert.match(block,/fetch\('\/api\/rx\/client\/chat'/);
 assert.match(block,/Authorization:'Bearer '/);
});
