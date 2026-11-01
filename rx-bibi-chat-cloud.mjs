// RX BIBI #702: bounded, user-scoped cloud chat adapter. Not enabled in production.
// Requires a separately provisioned RLS-protected rx_bibi_chat_snapshots table.
const MAX_TURNS=20;
function validateTurns(turns){
 if(!Array.isArray(turns)||turns.length>MAX_TURNS||turns.length%2!==0||
    turns.some((turn,i)=>typeof turn!=='string'||!turn.trim()||turn.length>(i%2===0?2000:4000)))
  throw new TypeError('Invalid conversation turns');
 return [...turns];
}
async function ownerId(client){
 if(!client||typeof client.from!=='function'||typeof client.auth?.getUser!=='function')throw new TypeError('Authenticated client required');
 const {data,error}=await client.auth.getUser();
 if(error||typeof data?.user?.id!=='string'||!/^[0-9a-f-]{36}$/i.test(data.user.id))throw new Error('Authentication required');
 return data.user.id;
}
export async function saveBibiChatSnapshot(client,turns){
 const safe=validateTurns(turns);
 const user_id=await ownerId(client);
 const {error}=await client.from('rx_bibi_chat_snapshots').upsert({user_id,turns:safe},{onConflict:'user_id'});
 if(error)throw new Error('Cloud chat save unavailable');
 return true;
}
export async function loadBibiChatSnapshot(client){
 const user_id=await ownerId(client);
 const {data,error}=await client.from('rx_bibi_chat_snapshots').select('turns').eq('user_id',user_id).maybeSingle();
 if(error)throw new Error('Cloud chat load unavailable');
 return data?validateTurns(data.turns):[];
}
