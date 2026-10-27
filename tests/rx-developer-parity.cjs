'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=fs.readFileSync('guard/rx-developer-core.cjs','utf8');
const browser=fs.readFileSync('guard/rx-developer-core-browser.js','utf8');
const marker='module.exports={maskJavaScript,analyzeJavaScript};';
assert(core.includes(marker),'Core export marker must exist');
const expected='// Browser adapter for RX Developer Core; do not edit independently.\n'+core.replace(marker,"if(typeof window!=='undefined')window.RXDeveloperCore=Object.freeze({maskJavaScript,analyzeJavaScript});");
assert.equal(browser,expected,'RX Developer browser adapter must match source core; synchronize both before merging');
// Browser and Node implementations must agree on edge cases, not just source text.
const vm=require('node:vm');
const {analyzeJavaScript,maskJavaScript}=require('../guard/rx-developer-core.cjs');
const context={window:{}};
vm.runInNewContext(browser,context,{timeout:1000,filename:'rx-developer-core-browser.js'});
const browserCore=context.window.RXDeveloperCore;
const cases=[
 '',
 'const safe=1;',
 'console.debug("secret");',
 '/* eval("ignored") */ eval("flag");',
 'const t=`hello ${console.log(42)}`;',
 'const rx=/eval\\(secret\\)/g; console.info("ok");',
 'const lines="a\\nb";\\nsetInterval(tick,1000);'.replace('\\nsetInterval','\nsetInterval'),
 'window.open(url); location.href=target; localStorage.setItem("key",token);',
 'document.cookie="x=1"; document.write("<b>x</b>");',
 'const x = 1 / 2; // innerHTML = ignored',
 'function f(){return /a[\\/]b/.test(value)}',
 'a.innerHTML=value; a.outerHTML=value; a.insertAdjacentHTML("beforeend",value);'
];
for(const [index,input] of cases.entries()){
 assert.equal(browserCore.maskJavaScript(input),maskJavaScript(input),'Mask mismatch in case '+index);
 assert.deepEqual(JSON.parse(JSON.stringify(browserCore.analyzeJavaScript(input))),analyzeJavaScript(input),'Finding mismatch in case '+index);
}
console.log('RX Developer browser/core parity and '+cases.length+' edge cases OK');
