'use strict';
const assert=require('node:assert/strict');
const origin='https://vexorio.grzegorzbub1985.workers.dev';
let session=process.env.RX_BIBI_TEST_ACCESS_TOKEN;
async function run(){
 if(!session){
  const configResponse=await fetch(origin+'/api/rx/client/config');
  assert.equal(configResponse.status,200);
  const config=await configResponse.json();
  const login=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.anonKey,'Content-Type':'application/json'},body:JSON.stringify({email:process.env.RX_BIBI_TEST_EMAIL,password:process.env.RX_BIBI_TEST_PASSWORD})});
  if(!login.ok)throw Error('NOT VERIFIED: dedicated test login rejected (HTTP '+login.status+')');
  session=(await login.json()).access_token;
 }
 if(!session)throw Error('NOT VERIFIED: no authorized test session');
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
