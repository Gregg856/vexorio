import assert from 'node:assert/strict';
import {findRXKnowledge,RX_KNOWLEDGE} from '../rx-knowledge-base.mjs';
assert.ok(RX_KNOWLEDGE.length>=4);
for(const q of ['Co to jest wirnik RX?','Opowiedz o mrówkach RX','Czym jest RX Wiedza Świata?']){
 const answer=findRXKnowledge(q);
 assert.ok(answer,q);
 assert.ok(answer.source&&answer.summary&&answer.local);
}
assert.equal(findRXKnowledge('Opowiedz o mrówkach RX').title,'Mrówki RX');
assert.equal(findRXKnowledge('Czym jest RX Wiedza Świata?').title,'RX Wiedza Świata');
assert.equal(findRXKnowledge('Co to jest wirnik RX?').title,'Wirnik RX');
assert.equal(findRXKnowledge('Co to jest RX?').title,'Mózg RX');
assert.equal(findRXKnowledge('Porównaj mrówki RX i wirnik RX'),null,'Two distinct modules need a multi-topic answer, not one random entry');
assert.equal(findRXKnowledge('Opowiedz o wirniku RX i Wiedzy Świata'),null,'Do not select one module for a multi-topic question');
assert.equal(findRXKnowledge('Co to jest fotosynteza?'),null);
assert.equal(findRXKnowledge(''),null);
console.log('RX local knowledge PASS');
