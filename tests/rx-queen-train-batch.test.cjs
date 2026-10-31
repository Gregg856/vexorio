'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {trainQueenFromBatch,convertAntReviews}=require('../rx-queen-train-batch.cjs');
test('Queen trains approved examples from a local batch without changing production',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-queen-batch-'));
 try{
  const file=path.join(dir,'batch.json');
  const training=[['serdeczne ukłony','greeting'],['sprawdzenie modułów','tests'],['przywołanie wiadomości','memory'],['mnożenie wartości','math']].map(([text,label])=>({text,label,approvedForTraining:true}));
  const validation=[['witam cię ponownie','greeting'],['skontroluj działanie','tests'],['odtwórz plan projektu','memory'],['dodaj wartości liczbowe','math']];
  await fs.writeFile(file,JSON.stringify({schema:1,approvedForTraining:true,training,validation}));
  const result=await trainQueenFromBatch(file);
  assert.equal(result.trainingExamples,4);
  assert.equal(result.candidates.length,5);
  assert.equal(result.baseline.total,4);
  assert.deepEqual(Object.keys(result.baseline.byLabel),['greeting','tests','memory','math']);
  assert.equal(Object.values(result.baseline.byLabel).reduce((n,v)=>n+v.total,0),4);
  assert.ok(result.candidates.every(c=>Object.values(c.byLabel).reduce((n,v)=>n+v.correct,0)===c.correct));
  assert.equal(result.improvement,result.selected.correct-result.baseline.correct);
  console.log('BIBI OFFLINE TRAINING METRICS',JSON.stringify({training:result.trainingExamples,validation:result.validationExamples,baseline:result.baseline,selected:result.selected,improvement:result.improvement,productionConnected:result.productionConnected}));
  assert.equal(result.productionConnected,false);
  training[0].approvedForTraining=false;
  await fs.writeFile(file,JSON.stringify({schema:1,approvedForTraining:true,training,validation}));
  await assert.rejects(trainQueenFromBatch(file),/not approved/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});

test('existing Queen trainer accepts human-reviewed ant samples without another RX trainer',()=>{
 const reviews=[['serdeczne ukłony','greeting'],['sprawdzenie modułów','tests'],['przywołanie wiadomości','memory'],['mnożenie wartości','math']].map(([text,label],i)=>({text,label,humanApproved:true,testReference:'verified-123'+i}));
 const validation=[['witam cię ponownie','greeting'],['skontroluj działanie','tests'],['odtwórz plan projektu','memory'],['dodaj wartości liczbowe','math']];
 const batch=convertAntReviews({reviews,validation});
 assert.equal(batch.training.length,4);
 assert.ok(batch.training.every(x=>x.approvedForTraining));
 assert.throws(()=>convertAntReviews({reviews:[{...reviews[0],humanApproved:false},...reviews.slice(1)],validation}),/Unapproved/);
 assert.throws(()=>convertAntReviews({reviews:[...reviews.slice(0,3),reviews[0]],validation}),/Duplicate/);
});

test('Queen rejects validation phrases seen in its original training set',async()=>{
 const {trainQueen}=require('../rx-queen-training-selection.cjs');
 const validation=[['cześć królowo','greeting'],['skontroluj działanie','tests'],['odtwórz plan projektu','memory'],['dodaj wartości liczbowe','math']];
 assert.throws(()=>trainQueen({validation}),/Validation overlap/);
});

test('Queen keeps baseline when candidate cannot improve independent validation',()=>{
 const {trainQueen}=require('../rx-queen-training-selection.cjs');
 const validation=[['witam cię ponownie','greeting'],['skontroluj działanie','tests'],['odtwórz plan projektu','memory'],['dodaj wartości liczbowe','math']];
 const result=trainQueen({validation});
 assert.ok(result.selected.correct>=result.baseline.correct);
 assert.equal(result.improvement,Math.max(0,result.candidateImprovement));
 assert.equal(result.accepted,result.candidateImprovement>0);
 if(!result.accepted)assert.equal(result.selected.source,'baseline');
});

test('40 approved synthetic samples: report which intents degrade on unseen validation',()=>{
 const training={"greeting":["hej moja droga bibi","miłego popołudnia królowo","przesyłam ci serdeczne uściski","wspaniale znowu cię słyszeć","dzień dobry moja asystentko","cieszę się że jesteś online","pozdrawiam cię z uśmiechem","witam po długiej przerwie bibi","życzymy ci spokojnego dnia","dobrze że możemy porozmawiać"],"tests":["sprawdź stan wszystkich kontroli","pokaż czy weryfikacja zakończyła się pomyślnie","czy test integracyjny przeszedł","odczytaj ostatnie błędy testowe","podsumuj rezultaty automatycznych kontroli","przeanalizuj wynik sprawdzenia kodu","czy wszystkie kontrole są zakończone","pokaż liczbę nieudanych prób testowych","sprawdź poprawność ostatniej aktualizacji","zweryfikuj czy moduł przeszedł kontrolę"],"memory":["przywołaj plan zapisany wcześniej","co zapamiętałaś z naszego projektu","odszukaj poprzednie ustalenia zespołu","przypomnij mi ostatnią decyzję","wróć do historii zapisanych zadań","pokaż co zostało w twojej pamięci","czy zachowałaś informacje z poprzedniej sesji","odtwórz listę naszych wcześniejszych celów","przypomnij gdzie przerwaliśmy pracę","znajdź zapamiętane wskazówki projektu"],"math":["oblicz sumę czterech kwot","podziel koszt na trzy równe części","ile wynosi dwadzieścia procent ceny","wyznacz iloczyn siedmiu i dziewięciu","policz różnicę dwóch wydatków","jaka jest średnia pięciu liczb","oblicz wartość po rabacie","ile zostanie po odjęciu kosztów","pomnóż liczbę zamówień przez cenę","wylicz łączną wartość faktur"]};
 const validation=[["jak miło z tobą dzisiaj rozmawiać","greeting"],["przesyłam uśmiech na powitanie","greeting"],["dobrego dnia asystentko","greeting"],["pokaż stan testu bezpieczeństwa","tests"],["zweryfikuj raport uruchomienia","tests"],["czy ostatnia kontrola była udana","tests"],["odtwórz decyzję z wcześniejszej sesji","memory"],["przypomnij zapisane cele","memory"],["pokaż historię naszych planów","memory"],["oblicz różnicę między kwotami","math"],["wylicz cenę po obniżce","math"],["policz łączny koszt zakupów","math"]];
 const approvedTraining=Object.entries(training).flatMap(([label,phrases])=>phrases.map(text=>[{text,approvedForTraining:true},label]));
 const {trainQueen}=require('../rx-queen-training-selection.cjs');
 const result=trainQueen({approvedTraining,validation});
 assert.equal(approvedTraining.length,40);
 assert.equal(result.baseline.total,12);
 assert.ok(result.selected.correct>=result.baseline.correct);
 console.log('BIBI 40 INTENT DIAGNOSTICS',JSON.stringify({baseline:result.baseline,bestCandidate:[...result.candidates].sort((a,b)=>b.correct-a.correct||a.finalLoss-b.finalLoss)[0],accepted:result.accepted,candidateImprovement:result.candidateImprovement}));
});

test('experimental Polish byte-bigram learner is deterministic and keeps default unchanged',()=>{
 const {createLearner}=require('../rx-text-learner.cjs');
 const {toBigramVector,toFrequencyVector}=require('../rx-language-tokenizer.cjs');
 const a=toBigramVector('kot pies'),b=toBigramVector('pies kot');
 assert.notDeepEqual(Array.from(a),Array.from(b));
 assert.deepEqual(Array.from(toBigramVector('abc')),Array.from(toBigramVector('abc')));
 const baseline=createLearner({epochs:10});
 const explicit=createLearner({epochs:10,features:'frequency'});
 assert.deepEqual(baseline.classify('dzień dobry'),explicit.classify('dzień dobry'));
 const model=createLearner({epochs:10,features:'bigram'});
 assert.ok(['greeting','tests','memory','math'].includes(model.classify('dzień dobry').label));
});

test('offline frequency versus bigram features on untouched holdout and challenge',()=>{
 const {createLearner}=require('../rx-text-learner.cjs');
 const {HOLDOUT,CHALLENGE}=require('../rx-text-evaluation.cjs');
 const evaluate=(learner,set)=>({correct:set.filter(([phrase,label])=>learner.classify(phrase).label===label).length,total:set.length});
 const results={};
 for(const features of ['frequency','bigram']){
  const model=createLearner({features});
  results[features]={holdout:evaluate(model,HOLDOUT),challenge:evaluate(model,CHALLENGE)};
 }
 assert.equal(results.frequency.holdout.total,24);
 assert.equal(results.bigram.challenge.total,32);
 console.log('BIBI FEATURE COMPARISON',JSON.stringify({results,productionConnected:false,trainedOnEvaluation:false}));
});

test('approved 40: compare frequency and bigram training on unseen validation',()=>{
 const {createLearner}=require('../rx-text-learner.cjs');
 const training={"greeting":["hej moja droga bibi","miłego popołudnia królowo","przesyłam ci serdeczne uściski","wspaniale znowu cię słyszeć","dzień dobry moja asystentko","cieszę się że jesteś online","pozdrawiam cię z uśmiechem","witam po długiej przerwie bibi","życzymy ci spokojnego dnia","dobrze że możemy porozmawiać"],"tests":["sprawdź stan wszystkich kontroli","pokaż czy weryfikacja zakończyła się pomyślnie","czy test integracyjny przeszedł","odczytaj ostatnie błędy testowe","podsumuj rezultaty automatycznych kontroli","przeanalizuj wynik sprawdzenia kodu","czy wszystkie kontrole są zakończone","pokaż liczbę nieudanych prób testowych","sprawdź poprawność ostatniej aktualizacji","zweryfikuj czy moduł przeszedł kontrolę"],"memory":["przywołaj plan zapisany wcześniej","co zapamiętałaś z naszego projektu","odszukaj poprzednie ustalenia zespołu","przypomnij mi ostatnią decyzję","wróć do historii zapisanych zadań","pokaż co zostało w twojej pamięci","czy zachowałaś informacje z poprzedniej sesji","odtwórz listę naszych wcześniejszych celów","przypomnij gdzie przerwaliśmy pracę","znajdź zapamiętane wskazówki projektu"],"math":["oblicz sumę czterech kwot","podziel koszt na trzy równe części","ile wynosi dwadzieścia procent ceny","wyznacz iloczyn siedmiu i dziewięciu","policz różnicę dwóch wydatków","jaka jest średnia pięciu liczb","oblicz wartość po rabacie","ile zostanie po odjęciu kosztów","pomnóż liczbę zamówień przez cenę","wylicz łączną wartość faktur"]};
 const validation=[["jak miło z tobą dzisiaj rozmawiać","greeting"],["przesyłam uśmiech na powitanie","greeting"],["dobrego dnia asystentko","greeting"],["pokaż stan testu bezpieczeństwa","tests"],["zweryfikuj raport uruchomienia","tests"],["czy ostatnia kontrola była udana","tests"],["odtwórz decyzję z wcześniejszej sesji","memory"],["przypomnij zapisane cele","memory"],["pokaż historię naszych planów","memory"],["oblicz różnicę między kwotami","math"],["wylicz cenę po obniżce","math"],["policz łączny koszt zakupów","math"]];
 const {HOLDOUT,CHALLENGE}=require('../rx-text-evaluation.cjs');
 const approved=Object.entries(training).flatMap(([label,phrases])=>phrases.map(text=>[{text,approvedForTraining:true},label]));
 const score=(model,cases)=>cases.filter(([text,label])=>model.classify(text).label===label).length;
 const results={};
 for(const features of ['frequency','bigram']){
  const before=createLearner({features});
  const after=createLearner({features,additionalExamples:approved});
  results[features]={validation:{before:score(before,validation),after:score(after,validation),total:validation.length},holdout:{before:score(before,HOLDOUT),after:score(after,HOLDOUT),total:HOLDOUT.length},challenge:{before:score(before,CHALLENGE),after:score(after,CHALLENGE),total:CHALLENGE.length}};
 }
 assert.equal(approved.length,40);
 console.log('BIBI 40 FEATURE TRAINING COMPARISON',JSON.stringify({results,productionConnected:false}));
});

test('RX Brain opt-in neural shadow does not change answers or execute actions',()=>{
 const {chatRX,chatRXWithIntentDiagnostics}=require('../rx-brain-chat-engine.cjs');
 const unseen=[
  ['serdecznie cię dzisiaj witam','greeting'],
  ['skontroluj czy ostatni test się powiódł','tests'],
  ['przywróć informacje z poprzednich ustaleń','memory'],
  ['wylicz całkowitą sumę wydatków','math'],
  ['miło cię znów spotkać','greeting'],
  ['sprawdzenie jakości zakończyło się poprawnie','tests'],
  ['odszukaj to co wcześniej zapamiętałaś','memory'],
  ['jaki będzie wynik mnożenia tych liczb','math']
 ];
 let hits=0;
 for(const [message,expected] of unseen){
  const plain=chatRX(message);
  const shadow=chatRXWithIntentDiagnostics(message);
  assert.deepEqual({answer:shadow.answer,plan:shadow.plan,completedCount:shadow.completedCount,contextUsed:shadow.contextUsed,executed:shadow.executed},plain);
  assert.equal(shadow.intentDiagnostics.advisoryOnly,true);
  assert.equal(shadow.intentDiagnostics.changedAnswer,false);
  assert.equal(shadow.intentDiagnostics.executed,0);
  assert.equal(shadow.intentDiagnostics.trainedOnUserMessages,false);
  if(shadow.intentDiagnostics.label===expected)hits++;
 }
 console.log('BIBI RX BRAIN SHADOW NEW PHRASES',JSON.stringify({correct:hits,total:unseen.length,productionConnected:false}));
 const math=chatRXWithIntentDiagnostics('oblicz 2 + 3');
 assert.equal(math.answer,'Wynik: 5');
 assert.equal(math.executed,0);
 assert.deepEqual(chatRX('hej'),chatRX('hej'));
});

test('self-hosted BIBI bridge is opt-in and preserves worker authentication boundary',async()=>{
 const fs=require('node:fs/promises');
 const source=await fs.readFile(require('node:path').join(__dirname,'../rx-cloud-server.cjs'),'utf8');
 const auth=source.indexOf('let response=await worker.fetch(request,env)');
 const gate=source.indexOf("process.env.RX_BIBI_INTENT_SHADOW==='true'");
 const diagnostic=source.indexOf('chatRXWithIntentDiagnostics(payload.message)',gate);
 assert.ok(auth>=0&&gate>auth&&diagnostic>gate);
 assert.match(source,/original\?\.ok===true/);
 assert.match(source,/response\.status===200/);
 assert.match(source,/response\.clone\(\)\.json\(\)/);
 assert.match(source,/new Response\(body,\{status:200,headers:outHeaders\}\)/);
 assert.match(source,/Advisory model failures never affect the authenticated original reply/);
});

test('RX CLOUD real HTTP shadow bridge preserves answers and denies wrong origin',async()=>{
 const {start}=require('../rx-cloud-server.cjs');
 const networkFetch=global.fetch;
 const original={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_ANON_KEY:process.env.SUPABASE_ANON_KEY,RX_BIBI_INTENT_SHADOW:process.env.RX_BIBI_INTENT_SHADOW};
 try{
  process.env.SUPABASE_URL='https://testproject.supabase.co';
  process.env.SUPABASE_ANON_KEY='test-anon-key';
  global.fetch=async(input,options)=>{
   const url=String(input);
   if(url.startsWith('http://127.0.0.1:'))return networkFetch(input,options);
   if(url==='https://testproject.supabase.co/auth/v1/user')
    return new Response(JSON.stringify({id:'00000000-0000-4000-8000-000000000001',is_anonymous:false}),{status:200,headers:{'Content-Type':'application/json'}});
   throw Error('Unexpected external fetch: '+url);
  };
  async function send(enabled,origin='http://localhost'){
   process.env.RX_BIBI_INTENT_SHADOW=enabled?'true':'false';
   const server=await start({port:0,host:'127.0.0.1'});
   try{
    const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/rx/client/chat',{
     method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer test-token'},
     body:JSON.stringify({message:'serdecznie cię witam',history:[],tasks:[]})
    });
    return {status:response.status,body:await response.json()};
   }finally{await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}
  }
  const off=await send(false),on=await send(true),denied=await send(true,'https://wrong.example');
  assert.equal(off.status,200);
  assert.equal(on.status,200);
  assert.equal(off.body.answer,on.body.answer);
  assert.equal(off.body.intentDiagnostics,undefined);
  assert.equal(on.body.intentDiagnostics?.model,'rx-neural-bigram-shadow');
  assert.equal(on.body.intentDiagnostics?.advisoryOnly,true);
  assert.equal(on.body.intentDiagnostics?.changedAnswer,false);
  assert.equal(on.body.executed,0);
  assert.equal(denied.status,403);
  assert.equal(denied.body.intentDiagnostics,undefined);
 }finally{
  global.fetch=networkFetch;
  for(const [key,value] of Object.entries(original)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 }
});
