// RX BIBI staging integration: requires TWO existing disposable test accounts.
// Run only against staging with RX_BIBI_STAGING_URL, RX_BIBI_STAGING_ANON_KEY,
// RX_BIBI_TEST_A_EMAIL/PASSWORD, RX_BIBI_TEST_B_EMAIL/PASSWORD.
// Never use a service-role key or production account.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {saveBibiChatSnapshot,loadBibiChatSnapshot} from '../rx-bibi-chat-cloud.mjs';
const keys=['RX_BIBI_STAGING_URL','RX_BIBI_STAGING_ANON_KEY','RX_BIBI_TEST_A_EMAIL','RX_BIBI_TEST_A_PASSWORD','RX_BIBI_TEST_B_EMAIL','RX_BIBI_TEST_B_PASSWORD'];
if(keys.some(k=>!process.env[k])){console.log('SKIP staging authenticated isolation test: dedicated staging credentials not configured');process.exit(0);}
const url=process.env.RX_BIBI_STAGING_URL;
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)||url.includes('lfytoxcnutduahshbsko')||!url.includes('owkjdlpawczrnwyszduj'))throw Error('Staging-only Supabase URL required');
const make=()=>createClient(url,process.env.RX_BIBI_STAGING_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const a=make(),b=make();
const login=async(client,email,password)=>{const {data,error}=await client.auth.signInWithPassword({email,password});if(error||!data?.user)throw Error('Dedicated staging account login failed');return data.user.id;};
const idA=await login(a,process.env.RX_BIBI_TEST_A_EMAIL,process.env.RX_BIBI_TEST_A_PASSWORD);
const idB=await login(b,process.env.RX_BIBI_TEST_B_EMAIL,process.env.RX_BIBI_TEST_B_PASSWORD);
assert.notEqual(idA,idB,'Two distinct test users required');
const token='rx-bibi-isolation-'+Date.now();
try{
 await saveBibiChatSnapshot(a,[token+' A','Odpowiedź A']);
 assert.deepEqual(await loadBibiChatSnapshot(a),[token+' A','Odpowiedź A']);
 assert.deepEqual(await loadBibiChatSnapshot(b),[]);
 const {data:cross,error:crossError}=await b.from('rx_bibi_chat_snapshots').select('turns').eq('user_id',idA);
 assert.ifError(crossError);assert.deepEqual(cross,[]);
 const {error:writeError}=await b.from('rx_bibi_chat_snapshots').upsert({user_id:idA,turns:['Nie','Wolno']},{onConflict:'user_id'});
 assert.ok(writeError,'Cross-account upsert must fail');
 console.log('PASS staging RLS: owner save/read, cross-account read/write denied');
}finally{
 const {error}=await a.from('rx_bibi_chat_snapshots').delete().eq('user_id',idA);
 if(error)console.error('Cleanup of dedicated staging snapshot failed');
 await Promise.all([a.auth.signOut(),b.auth.signOut()]);
}
