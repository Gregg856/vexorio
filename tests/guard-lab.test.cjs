'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('guard-lab.html','utf8');
const script=fs.readFileSync('guard-lab.js','utf8');
new vm.Script(script,{filename:'guard-lab.js'});
for(const id of ['f','t','d','out'])assert.ok(html.includes('id="'+id+'"'),'Missing lab control '+id);
assert.ok(html.includes('noindex,nofollow'),'Lab must not be indexed');
assert.ok(!/\bsupabase\b|fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon/i.test(script),'Lab must remain local-only');
assert.ok(!/\b(?:delete|approve|reject)Listing\s*\(/.test(script),'Lab must not mutate listings');
assert.ok(/src="\/guard-lab\.js(?:\?v=[a-z0-9]+)?"/.test(html),'Lab script must be loaded');
const {screenListing}=require('../guard/engine.cjs');
const fixtures=[
 {title:'Sprzedam rower',description:'Rower sprawny, odbiór osobisty.',score:0},
 {title:'Sprzedam telefon',description:'Wyślij mi swoje hasło i zapłać przez Western Union.',score:95},
 {title:'Super inwestycja',description:'Gwarantowany zysk! Wpłać natychmiast, aby otrzymać pieniądze.',score:55},
 {title:'Powtarzany spam',description:'promocja promocja promocja promocja promocja promocja promocja promocja',score:15}
];
for(const fixture of fixtures){
 const nodes={t:{value:fixture.title},d:{value:fixture.description},out:{textContent:''},f:{addEventListener:(name,callback)=>{if(name==='submit')nodes.submit=callback}}};
 const sandbox={document:{getElementById:id=>nodes[id]},console};
 vm.runInNewContext(script,sandbox,{filename:'guard-lab.js',timeout:1000});
 assert.equal(typeof nodes.submit,'function','Missing submit handler');
 nodes.submit({preventDefault(){}});
 const expected=screenListing(fixture);
 assert.equal(expected.score,fixture.score,'Guard engine fixture changed');
 assert.ok(nodes.out.textContent.includes('WYNIK: '+expected.score+'/100'),'Browser and engine score diverged');
 const browserSignals=nodes.out.textContent;
 const labels={
  credential_request:'Prośba o hasło lub kod weryfikacyjny',
  external_payment:'Podejrzana forma płatności poza portalem',
  guaranteed_profit:'Podejrzana obietnica gwarantowanego zysku',
  pressure_tactic:'Presja na natychmiastową wpłatę'
 };
 for(const signal of expected.signals){
  assert.ok(script.includes(signal),'Browser missing engine signal: '+signal);
  if(labels[signal])assert.ok(browserSignals.includes(labels[signal]),'Browser did not actually detect '+signal);
 }
 assert.equal((browserSignals.match(/• /g)||[]).length,expected.signals.length,'Browser signal count diverged');
}
console.log('PASS: Guard lab JS syntax, UI controls, privacy and advisory-only isolation');
