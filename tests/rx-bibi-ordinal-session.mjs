import assert from 'node:assert/strict';
import {answerRXSession} from '../rx-bibi-session-reasoner.mjs';
const history=['Mam trzy zadania: naprawić czat, sprawdzić pamięć i przetestować matematykę. Powtórz je.','👑 Twoje trzy zadania: 1) naprawić czat; 2) sprawdzić pamięć; 3) przetestować matematykę.'];
const result=answerRXSession('Które z moich zadań jest drugie?',history);
assert.ok(result?.answer.includes('sprawdzić pamięć'),JSON.stringify(result));
console.log('PASS: BIBI identifies second task from conversation');
