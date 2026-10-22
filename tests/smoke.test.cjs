const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const checks=[];
function check(name,fn){try{fn();checks.push('PASS '+name)}catch(e){checks.push('FAIL '+name+': '+e.message);process.exitCode=1}}
check('HTML document',()=>assert.match(html,/^<!doctype html>/i));
check('Unique HTML IDs',()=>{const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length)});
check('Core UI elements',()=>{for(const id of ['categories','mobileCategoryBrowser','mobileCategorySubcats','categorySubfilters','query','newCategory','radiusFilter'])assert.match(html,new RegExp('id=["\x27]'+id+'["\x27]'))});
check('Single category renderer',()=>assert.equal((html.match(/function renderCats\(\)/g)||[]).length,1));
check('Category panel is not deleted with buttons',()=>assert.match(html,/if\(subPanel&&browser&&subPanel\.parentElement!==browser\)browser\.append\(subPanel\);box\.replaceChildren\(\)/));
check('Mobile duplicate filters hidden',()=>assert.match(html,/#categorySubfilters\s*\{display:none!important\}/));
check('JS syntax',()=>{let n=0;for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(m[1].trim())new Function(m[1]);n++}assert.ok(n>0)});
check('No unguarded known removed filter listener',()=>assert.doesNotMatch(html,/\$\('clearListingFilters'\)\.addEventListener/));
console.log(checks.join('\n'));
