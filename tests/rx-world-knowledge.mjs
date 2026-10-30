import assert from 'node:assert/strict';
import {searchWorldKnowledge} from '../rx-world-knowledge.mjs';
let calls=0;
const fetcher=async(url)=>{calls++;assert.match(url,/pl.wikipedia.org\/w\/api.php/);return {ok:true,json:async()=>({query:{pages:{'1':{title:'Warszawa',extract:'Warszawa jest stolicą Polski.',fullurl:'https://pl.wikipedia.org/wiki/Warszawa'}}}})}};
const result=await searchWorldKnowledge('Co to jest Warszawa?',{fetcher});
assert.equal(result.title,'Warszawa');
assert.match(result.summary,/stolicą Polski/);
assert.match(result.url,/wikipedia.org/);
assert.equal(calls,1);
assert.equal(await searchWorldKnowledge('',{fetcher}),null);
assert.equal(await searchWorldKnowledge('a'.repeat(301),{fetcher}),null);
assert.equal(await searchWorldKnowledge('Co to jest nieznane?',{fetcher:async()=>({ok:true,json:async()=>({query:{pages:{}}})})}),null);
console.log('RX world knowledge source lookup PASS');

const again=await searchWorldKnowledge('Co to jest Warszawa?',{fetcher});
assert.equal(calls,1,'repeated query should use cache');
assert.equal(again.cached,true);
assert.equal(again.retrievedAt,result.retrievedAt);

// Queen and BIBI share the same search normalization, not two separate brains.
const requested=[];
const recordFetcher=async(url)=>{requested.push(new URL(url).searchParams.get('gsrsearch'));return {ok:true,json:async()=>({query:{pages:{'2':{title:'Kwanty',extract:'Weryfikowana wiedza o kwantach.',fullurl:'https://pl.wikipedia.org/wiki/Kwant'}}}})}};
for(const phrase of ['Znajdź informacje o komputerach kwantowych','Wyszukaj informacje o fizyce kwantowej','Poszukaj informacji o mechanice kwantowej']){
 const answer=await searchWorldKnowledge(phrase,{fetcher:recordFetcher});
 assert.match(answer.summary,/kwantach/);
}
assert.deepEqual(requested,['komputerach kwantowych','fizyce kwantowej','mechanice kwantowej']);
