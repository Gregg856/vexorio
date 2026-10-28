import assert from 'node:assert/strict';
import {findRXKnowledge,RX_KNOWLEDGE} from '../rx-knowledge-base.mjs';
assert.ok(RX_KNOWLEDGE.length>=4);
for(const q of ['Co to jest wirnik RX?','Opowiedz o mrówkach RX','Czym jest RX Wiedza Świata?']){
 const answer=findRXKnowledge(q);
 assert.ok(answer,q);
 assert.ok(answer.source&&answer.summary&&answer.local);
}
assert.equal(findRXKnowledge('Co to jest fotosynteza?'),null);
assert.equal(findRXKnowledge(''),null);
console.log('RX local knowledge PASS');
