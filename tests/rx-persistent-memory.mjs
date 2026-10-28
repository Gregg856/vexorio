import assert from 'node:assert/strict';
import {handleRXMemory} from '../rx-persistent-memory.mjs';
const args={base:new URL('https://example.supabase.co'),apikey:'test-key',auth:'Bearer test-token',userId:'00000000-0000-0000-0000-000000000001'};
let stored;
const fetcher=async(url,options)=>{
 assert.equal(url.hostname,'example.supabase.co');
 assert.equal(options.headers.Authorization,args.auth);
 if(options.method==='POST'){stored=JSON.parse(options.body)[0];assert.equal(stored.owner_id,args.userId);return {ok:true};}
 assert.equal(url.searchParams.get('owner_id'),'eq.'+args.userId);
 return {ok:true,json:async()=>[{content:stored.content,updated_at:stored.updated_at}]};
};
const saved=await handleRXMemory('Zapamiętaj: Wirnik | Cztery testy zatwierdzone',{...args,fetcher});
assert.equal(saved.memoryAction,'saved');
const recalled=await handleRXMemory('Przypomnij: Wirnik',{...args,fetcher});
assert.match(recalled.answer,/Cztery testy/);
assert.equal(await handleRXMemory('Cześć',{...args,fetcher}),null);
console.log('RX persistent memory contract PASS');
