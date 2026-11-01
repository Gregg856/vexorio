import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

const origin='https://vexorio.grzegorzbub1985.workers.dev';
const env={SUPABASE_URL:'https://testproject.supabase.co/',SUPABASE_ANON_KEY:'public-test-key',RX_BIBI_CLIENT_MODEL_FIRST:'true',RX_BIBI_WORKERS_AI_ENABLED:'true',
  AI:{run:async()=>{throw new Error('Model should not override contextual conversation');}}};
const realFetch=globalThis.fetch;
const history=[];
async function chat(message){
  const request=new Request(origin+'/api/rx/client/chat',{method:'POST',headers:{Origin:origin,Authorization:'Bearer test-session','Content-Type':'application/json'},body:JSON.stringify({message,history})});
  const response=await worker.fetch(request,env);
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.ok,true);
  assert.equal(data.executed,0);
  assert.equal(data.modelInferenceUsed,false);
  assert.equal(data.engine,'rx-bibi-client-context-planner');
  history.push(message,data.answer);
  return data.answer;
}
test('authenticated client endpoint preserves RX Ant examples across turns',async()=>{
  globalThis.fetch=async(input)=>{
    const url=String(input);
    if(url.includes('/auth/v1/user'))return Response.json({id:'test-user',is_anonymous:false});
    throw new Error('Unexpected network call: '+url);
  };
  try{
    const first=await chat('BIBI, porozmawiajmy o RX Mrówkach. Wyjaśnij własnymi słowami, jak małe moduły AI mogą wspólnie rozwiązywać zadania. Podaj trzy konkretne przykłady.');
    assert.match(first,/przyk[lł]ad|1[.)]/iu);
    const second=await chat('A drugi?');
    assert.ok(second.length>30);
    assert.doesNotMatch(second,/Stan kolejki sprawdzisz/iu);
  }finally{globalThis.fetch=realFetch;}
});
