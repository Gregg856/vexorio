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

test('approved 40 synthetic examples: train Queen and report independent validation',async()=>{
 const training=[{"text":"hej moja droga bibi","label":"greeting","approvedForTraining":true},{"text":"miłego popołudnia królowo","label":"greeting","approvedForTraining":true},{"text":"przesyłam ci serdeczne uściski","label":"greeting","approvedForTraining":true},{"text":"wspaniale znowu cię słyszeć","label":"greeting","approvedForTraining":true},{"text":"dzień dobry moja asystentko","label":"greeting","approvedForTraining":true},{"text":"cieszę się że jesteś online","label":"greeting","approvedForTraining":true},{"text":"pozdrawiam cię z uśmiechem","label":"greeting","approvedForTraining":true},{"text":"witam po długiej przerwie bibi","label":"greeting","approvedForTraining":true},{"text":"życzymy ci spokojnego dnia","label":"greeting","approvedForTraining":true},{"text":"dobrze że możemy porozmawiać","label":"greeting","approvedForTraining":true},{"text":"sprawdź stan wszystkich kontroli","label":"tests","approvedForTraining":true},{"text":"pokaż czy weryfikacja zakończyła się pomyślnie","label":"tests","approvedForTraining":true},{"text":"czy test integracyjny przeszedł","label":"tests","approvedForTraining":true},{"text":"odczytaj ostatnie błędy testowe","label":"tests","approvedForTraining":true},{"text":"podsumuj rezultaty automatycznych kontroli","label":"tests","approvedForTraining":true},{"text":"przeanalizuj wynik sprawdzenia kodu","label":"tests","approvedForTraining":true},{"text":"czy wszystkie kontrole są zakończone","label":"tests","approvedForTraining":true},{"text":"pokaż liczbę nieudanych prób testowych","label":"tests","approvedForTraining":true},{"text":"sprawdź poprawność ostatniej aktualizacji","label":"tests","approvedForTraining":true},{"text":"zweryfikuj czy moduł przeszedł kontrolę","label":"tests","approvedForTraining":true},{"text":"przywołaj plan zapisany wcześniej","label":"memory","approvedForTraining":true},{"text":"co zapamiętałaś z naszego projektu","label":"memory","approvedForTraining":true},{"text":"odszukaj poprzednie ustalenia zespołu","label":"memory","approvedForTraining":true},{"text":"przypomnij mi ostatnią decyzję","label":"memory","approvedForTraining":true},{"text":"wróć do historii zapisanych zadań","label":"memory","approvedForTraining":true},{"text":"pokaż co zostało w twojej pamięci","label":"memory","approvedForTraining":true},{"text":"czy zachowałaś informacje z poprzedniej sesji","label":"memory","approvedForTraining":true},{"text":"odtwórz listę naszych wcześniejszych celów","label":"memory","approvedForTraining":true},{"text":"przypomnij gdzie przerwaliśmy pracę","label":"memory","approvedForTraining":true},{"text":"znajdź zapamiętane wskazówki projektu","label":"memory","approvedForTraining":true},{"text":"oblicz sumę czterech kwot","label":"math","approvedForTraining":true},{"text":"podziel koszt na trzy równe części","label":"math","approvedForTraining":true},{"text":"ile wynosi dwadzieścia procent ceny","label":"math","approvedForTraining":true},{"text":"wyznacz iloczyn siedmiu i dziewięciu","label":"math","approvedForTraining":true},{"text":"policz różnicę dwóch wydatków","label":"math","approvedForTraining":true},{"text":"jaka jest średnia pięciu liczb","label":"math","approvedForTraining":true},{"text":"oblicz wartość po rabacie","label":"math","approvedForTraining":true},{"text":"ile zostanie po odjęciu kosztów","label":"math","approvedForTraining":true},{"text":"pomnóż liczbę zamówień przez cenę","label":"math","approvedForTraining":true},{"text":"wylicz łączną wartość faktur","label":"math","approvedForTraining":true}];
 const validation=[["jak miło z tobą dzisiaj rozmawiać","greeting"],["przesyłam uśmiech na powitanie","greeting"],["dobrego dnia asystentko","greeting"],["pokaż stan testu bezpieczeństwa","tests"],["zweryfikuj raport uruchomienia","tests"],["czy ostatnia kontrola była udana","tests"],["odtwórz decyzję z wcześniejszej sesji","memory"],["przypomnij zapisane cele","memory"],["pokaż historię naszych planów","memory"],["oblicz różnicę między kwotami","math"],["wylicz cenę po obniżce","math"],["policz łączny koszt zakupów","math"]];
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rx-queen-40-'));
 try{
  const file=path.join(dir,'approved-40.json');
  await fs.writeFile(file,JSON.stringify({schema:1,approvedForTraining:true,training,validation}));
  const result=await trainQueenFromBatch(file);
  assert.equal(result.trainingExamples,40);
  assert.equal(result.validationExamples,12);
  assert.equal(result.candidates.length,5);
  assert.equal(result.productionConnected,false);
  console.log('BIBI APPROVED 40 TRAINING RESULTS',JSON.stringify({training:result.trainingExamples,validation:result.validationExamples,baseline:result.baseline,selected:result.selected,improvement:result.improvement,candidates:result.candidates,productionConnected:false}));
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
