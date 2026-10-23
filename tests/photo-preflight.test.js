const assert=require('node:assert/strict');const {check}=require('../staging/photo-preflight.js');
const file={type:'image/png',size:100};const read=async()=> 'data:image/png;base64,AAAA';
const client=(response)=>({supabaseUrl:'https://owkjdlpawczrnwyszduj.supabase.co',functions:{invoke:async()=>response}});
(async()=>{
 assert.equal((await check([file],client({data:{flagged:false}}),read)).allScreened,true);
 assert.equal((await check([file],client({data:{flagged:true}}),read)).requiresReview,true);
 assert.equal((await check([file],client({error:{message:'unavailable'}}),read)).requiresReview,true);
 assert.equal((await check([file],client({data:{}}),read)).requiresReview,true);
 await assert.rejects(()=>check([file],{supabaseUrl:'https://lfytoxcnutduahshbsko.supabase.co'},read),/staging_only/);
 await assert.rejects(()=>check([{type:'image/svg+xml',size:20}],client({}),read),/invalid_image/);
 console.log('PASS: staging photo preflight guards and fail-closed decisions');
})().catch(e=>{console.error(e);process.exitCode=1});
