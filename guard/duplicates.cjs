'use strict';
// VEXORIO Guard — privacy-preserving in-memory duplicate candidate detection.
// Advisory only. No database writes, no user identifiers, no external services.
const crypto=require('node:crypto');
const VERSION='1.1.0';
function words(s){
 if(typeof s!=='string')return [];
 return (s.normalize('NFKC').toLocaleLowerCase('und').match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>w.length>1).slice(0,600);
}
function signature(listing){
 if(!listing||typeof listing!=='object'||Array.isArray(listing))return null;
 const title=words(listing.title),description=words(listing.description);
 if(!title.length||!description.length)return null;
 const tokens=[...new Set([...title,...description])].sort();
 return {hash:crypto.createHash('sha256').update(tokens.join('|')).digest('hex'),tokens};
}
function compare(a,b){
 const x=signature(a),y=signature(b);
 if(!x||!y)return {status:'insufficient_data',similarity:0,possibleDuplicate:false};
 const sx=new Set(x.tokens),sy=new Set(y.tokens);
 let intersection=0;for(const word of sx)if(sy.has(word))intersection++;
 const similarity=intersection/(sx.size+sy.size-intersection);
 return {status:'compared',similarity:Math.round(similarity*1000)/1000,possibleDuplicate:similarity>=0.85};
}
function findCandidates(listing,others,{limit=10}={}){
 if(!Array.isArray(others))return [];
 return others.slice(0,500).map((candidate,index)=>({index,...compare(listing,candidate)}))
 .filter(x=>x.possibleDuplicate).sort((a,b)=>b.similarity-a.similarity).slice(0,Math.max(0,Math.min(50,limit)));
}
module.exports={VERSION,signature,compare,findCandidates};
