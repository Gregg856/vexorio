'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {validate,approve,approveWritingExercise,lookup}=require('../rx-queen-approved-memory.cjs');
const empty={schema:1,kind:'rx-queen-approved-responses',entries:[]};
test('explicit review required',()=>assert.throws(()=>approve(empty,{prompt:'cześć',answer:'Witaj',reviewId:'review-1'})));
test('approved response can be recalled exactly',()=>{const d=approve(empty,{prompt:'Cześć',answer:'Witaj!',reviewId:'review-1',approved:true});assert.equal(lookup(d,'cześć').answer,'Witaj!');});
test('rejects duplicate prompts and unapproved entries',()=>{assert.throws(()=>validate({...empty,entries:[{prompt:'x',answer:'y',reviewId:'review-1',approved:false}]}));});
test('rejects overlong answers',()=>assert.throws(()=>approve(empty,{prompt:'x',answer:'a'.repeat(601),reviewId:'review-1',approved:true})));

test('reviewed writing exercise becomes an exact-match chat response',()=>{
 const exercise={mode:'message',prompt:'dla przyjaciela',text:'Miłego dnia, przyjacielu!',productionConnected:false};
 const memory=approveWritingExercise(empty,{exercise,reviewId:'teacher-2026',approved:true});
 assert.equal(lookup(memory,'Napisz wiadomość: dla przyjaciela').answer,'Miłego dnia, przyjacielu!');
});
test('unapproved exercises never enter Queen memory',()=>{
 assert.throws(()=>approveWritingExercise(empty,{exercise:{mode:'reply',prompt:'cześć',text:'Witaj!'},reviewId:'teacher-2026'}));
 assert.throws(()=>approveWritingExercise(empty,{exercise:{mode:'message',prompt:'x',text:'y',autoApplied:true},reviewId:'teacher-2026',approved:true}));
});
