'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const handlers={};
const fields={
 guardRxForm:{addEventListener(type,fn){handlers[type]=fn}},
 guardRxResult:{textContent:''},
 guardRxTitle:{value:'Sprzedam rower'},
 guardRxDescription:{value:'Odbiór osobisty dobry stan'}
};
const context={document:{getElementById(id){return fields[id]||null}},console};
vm.runInNewContext(fs.readFileSync('guard-rx-browser.js','utf8'),context,{filename:'guard-rx-browser.js',timeout:2000});
assert.equal(typeof handlers.submit,'function');
handlers.submit({preventDefault(){}});
const output=fields.guardRxResult.textContent;
assert.match(output,/RX STRAŻAK 1\.0/);
assert.ok(output.includes(String.fromCharCode(10)+'Priorytet: '),'Report must contain actual newlines');
assert.ok(!output.includes('\\\\n'),'Report must not contain escaped newlines');
assert.match(output,/Bez wysyłania danych/);
console.log('PASS: RX browser report renders multiline local advisory result');
