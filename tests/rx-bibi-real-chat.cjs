'use strict';
const assert=require('node:assert/strict');
const origin='https://vexorio.grzegorzbub1985.workers.dev';
const session=process.env.RX_BIBI_TEST_ACCESS_TOKEN;
async function run(){
 if(!session)throw Error('NOT VERIFIED: authorized test session is not configured');
 const history=[];
 for(const message of ['BIBI, wyjaśnij, jak RX Mrówki wspólnie rozwiązują zadania. Podaj trzy przykłady.','A drugi?']){
  const response=await fetch(origin+'/api/rx/client/chat',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+session,'Content-Type':'application/json'},body:JSON.stringify({message,history}),signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,200,'Authenticated chat HTTP status');
  const data=await response.json();
  assert.equal(data.ok,true);
  if(history.length){assert.match(data.answer,/drugi przykład/iu);assert.equal(data.contextUsed,true);}
  history.push(message,data.answer);
 }
 console.log('VERIFIED: BIBI answered two authenticated turns with context');
}
run().catch(e=>{console.error(e.message);process.exitCode=1;});
