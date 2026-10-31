'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../rx-bibi-manager.html'),'utf8');
test('existing manager presents Queen BIBI without pretending own model is deployed',()=>{
 assert.match(html,/<title>RX BIBI Manager — panel Królowej<\/title>/);
 assert.match(html,/👑 Królowa BIBI — czat/);
 assert.match(html,/👑 RX BIBI — panel Królowej/);
 assert.match(html,/uruchomienie własnego modelu na serwerze nie jest jeszcze potwierdzone/);
 assert.match(html,/fetch\('\/api\/rx\/client\/chat'/);
 assert.match(html,/\['strażak','🛡️ Strażak'\]/);
 assert.match(html,/activate\('chat'\)/);
});
