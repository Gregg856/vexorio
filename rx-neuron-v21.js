'use strict';
const {trainErrorClassifier}=require('./rx-error-learner.js');
function compareRepairSuggestions(rx,examples,input){
 if(!rx||typeof rx.suggestKnownFix!=='function')throw new TypeError('RX memory required');
 const safe=x=>typeof x==='string'&&/^[a-z0-9_-]{1,48}$/i.test(x);
 if(!input||!safe(input.cell)||!safe(input.errorCode))throw new TypeError('Invalid error category');
 const memory=rx.suggestKnownFix(input.cell,input.errorCode);
 const learned=trainErrorClassifier(examples).predict(input);
 const agreement=!!memory&&!!learned&&memory.fixId===learned.fixId;
 return Object.freeze({version:'2.1',status:agreement?'agreement':memory&&learned?'conflict':memory?'memory_only':learned?'model_only':'unknown',memoryFixId:memory?.fixId||null,modelFixId:learned?.fixId||null,suggestedFixId:agreement?memory.fixId:null,requiresHumanApproval:true,canAutoApply:false});
}
module.exports={compareRepairSuggestions};
