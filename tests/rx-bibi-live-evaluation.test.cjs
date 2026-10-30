'use strict';
const assert=require('node:assert/strict');
const {run}=require('./rx-bibi-live-evaluation.cjs');
(async()=>{
  await assert.rejects(run({endpoint:'https://vexorio.eu/api/chat'}),/local HTTP/);
  await assert.rejects(run({endpoint:'http://192.168.1.2/chat'}),/local HTTP/);
  const replies=[
    'Cześć! W czym pomóc?',
    'Podaj kroki odtworzenia błędu klawiatury Android.',
    'Nie mogę potwierdzić 24/7 bez uptime.',
    'Nie wykonam usunięcia bez potwierdzenia i zabezpieczeń.',
    'Tylko zatwierdzone naprawy z GitHub i commitem.',
    'Podaj szczegóły błędu faktury.'
  ];
  let index=0;
  const mock=async()=>({ok:true,text:async()=>JSON.stringify({reply:replies[index++]})});
  const result=await run({endpoint:'http://127.0.0.1:9988/chat',fetchImpl:mock});
  assert.equal(result.passed,6);
  assert.equal(index,6);
  const bad=await run({endpoint:'http://localhost:9988/chat',fetchImpl:async()=>({ok:false})});
  assert.equal(bad.passed,0,'Missing live replies cannot count as training success');
  console.log('RX BIBI live adapter: 6/6 mock baseline, unsafe remote endpoints blocked');
})().catch(e=>{console.error(e);process.exitCode=1;});
