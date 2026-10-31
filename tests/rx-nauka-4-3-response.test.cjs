// RX NAUKA 4.3 — simulated read-only Brain API response tests.
// Run: node --test tests/rx-nauka-4-3-response.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','rx-bibi-manager.html'),'utf8');
const start=html.indexOf("     if(!entry){explain('RX Brain nie ma");
const end=html.indexOf("\n    }catch(error)",start);
assert.ok(start>=0&&end>start,'Existing Brain response branch must exist');
const snippet=html.slice(start,end);
function respond(entry,key='demo'){
  const messages=[];
  const context={entry,key,explain:message=>messages.push(message),Number};
  vm.runInNewContext(snippet,context,{timeout:1000});
  return messages.join(' ');
}
test('missing experience is reported, not invented',()=>{
  assert.match(respond(null),/nie ma zapisanego doświadczenia/);
});
test('reject invalid and nonfinite experience metrics',()=>{
  for(const entry of [
    {action:'x',samples:0,successRate:1},
    {action:'x',samples:1.5,successRate:1},
    {action:'x',samples:1,successRate:NaN},
    {action:'x',samples:1,successRate:Infinity},
    {action:'x',samples:1,successRate:-0.1},
    {action:'x',samples:1,successRate:1.1},
    {action:null,samples:1,successRate:0.5}
  ]) assert.match(respond(entry),/nieprawidłowe dane/);
});
test('small samples cannot be presented as strong evidence',()=>{
  assert.match(respond({action:'test',samples:2,successRate:1}),/Za mało prób/);
  assert.match(respond({action:'test',samples:8,successRate:1}),/Ograniczona liczba prób/);
});
test('failure-dominated experience warns and remains advisory',()=>{
  const reply=respond({action:'test',samples:20,successRate:0.3});
  assert.match(reply,/więcej niepowodzeń niż sukcesów/);
  assert.match(reply,/wymaga zatwierdzenia/);
  assert.match(reply,/Niczego nie wykonałam/);
});
test('action content is limited in the displayed recommendation',()=>{
  const reply=respond({action:'A'.repeat(300),samples:20,successRate:0.9});
  assert.ok(!reply.includes('A'.repeat(121)));
});
