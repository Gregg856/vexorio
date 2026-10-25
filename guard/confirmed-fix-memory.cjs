'use strict';
// RX confirmed-fix memory: exact fingerprint matches only; no code execution.
const fs=require('node:fs');
const FINGERPRINT=/^[a-f0-9]{16}$/i;
function parseConfirmedFixes(markdown){
 if(typeof markdown!=='string'||markdown.length>200000)throw Error('Invalid fixes document');
 const entries=[];
 const sections=markdown.split(/^### RX-FIX-(\d{4})\s+—\s+/m);
 for(let i=1;i+1<sections.length;i+=2){
  const id='RX-FIX-'+sections[i],body=sections[i+1];
  const title=body.split(/\r?\n/,1)[0].trim();
  const field=(name)=>{const prefix='- **'+name+':**';const line=body.split(/\r?\n/).find(value=>value.startsWith(prefix));return line?line.slice(prefix.length).trim():'';};
  const status=field('Status'),fingerprint=field('Odcisk awarii (RX-FINGERPRINT)');
  const commit=field('Commit lub PR'),test=field('Test regresyjny');
  if(status!=='potwierdzone'||!FINGERPRINT.test(fingerprint))continue;
  if(!/^https:\/\/github\.com\/Gregg856\/vexorio\/(?:commit|pull)\/\S+$/.test(commit))continue;
  if(!/^https:\/\/github\.com\/Gregg856\/vexorio\/actions\/runs\/\d+$/.test(test))continue;
  entries.push(Object.freeze({id,title,fingerprint:fingerprint.toLowerCase(),commit,test,requiresReview:true}));
 }
 return entries;
}
function findConfirmedFix(markdown,fingerprint){
 if(typeof fingerprint!=='string'||!FINGERPRINT.test(fingerprint))return null;
 return parseConfirmedFixes(markdown).find(item=>item.fingerprint===fingerprint.toLowerCase())||null;
}
function findFromFile(fingerprint,filename='docs/rx-confirmed-fixes.md'){
 return findConfirmedFix(fs.readFileSync(filename,'utf8'),fingerprint);
}
module.exports={parseConfirmedFixes,findConfirmedFix,findFromFile};
