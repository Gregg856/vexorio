'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('guard-lab.html','utf8');
const js=fs.readFileSync('guard-rx-programs.js','utf8');
assert.match(html,/id="rxProgramsCatalog"/);
assert.match(html,/id="rxProgramsList"/);
assert.match(html,/src="\/guard-rx-programs\.js"/);
new vm.Script(js,{filename:'guard-rx-programs.js'});
const entries=[...js.matchAll(/\['[^']+','[^']+','(panel|ci|experiment)','([^']+)'\]/g)];
assert.ok(entries.length>=15,'Expected at least 15 RX programs');
const names=[...js.matchAll(/\['([^']+)','[^']+','(?:panel|ci|experiment)','[^']+'\]/g)].map(m=>m[1]);
assert.equal(new Set(names).size,names.length,'Duplicate program names');
for(const [,status,url] of entries){
 if(url.startsWith('#'))assert.ok(html.includes('id="'+url.slice(1)+'"'),'Missing panel target '+url);
 else if(url.startsWith('/'))assert.ok(fs.existsSync(url.slice(1)),'Missing local page '+url);
 else assert.match(url,/^https:\/\/github\.com\/Gregg856\/vexorio(?:\/|$)/,'Unexpected external link');
 assert.ok(['panel','ci','experiment'].includes(status));
}
console.log('PASS RX PROGRAMS: catalog, syntax, '+entries.length+' links, no duplicates');
