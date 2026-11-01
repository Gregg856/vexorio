// RX BIBI #708 — use the EXISTING per-user rx_bibi_user_tasks table.
// The caller supplies its authenticated Supabase client. RLS remains authoritative.
// No service-role keys, no new tables and no automatic deployment.
async function owner(client) {
 if(!client?.auth?.getUser||typeof client.from!=='function')throw Error('Authenticated client required');
 const {data,error}=await client.auth.getUser();
 if(error||!data?.user?.id||data.user.is_anonymous)throw Error('Authentication required');
 return data.user.id;
}
function validate(title){
 if(typeof title!=='string'||!title.trim()||title.length>180)throw Error('Invalid task title');
 return title.trim();
}
export async function listBibiTasks(client){
 const user_id=await owner(client);
 const {data,error}=await client.from('rx_bibi_user_tasks').select('id,title,status,created_at,updated_at').eq('user_id',user_id).order('created_at',{ascending:false}).limit(50);
 if(error)throw Error('Task read failed');
 return data||[];
}
export async function deferBibiTask(client,title){
 const user_id=await owner(client);
 const {data,error}=await client.from('rx_bibi_user_tasks').insert({user_id,title:validate(title),status:'pending'}).select('id,title,status').single();
 if(error||!data)throw Error('Task save failed');
 return data;
}
export async function completeBibiTask(client,id){
 const user_id=await owner(client);
 if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw Error('Invalid task id');
 const {data,error}=await client.from('rx_bibi_user_tasks').update({status:'done',updated_at:new Date().toISOString()}).eq('user_id',user_id).eq('id',id).select('id,status').maybeSingle();
 if(error)throw Error('Task update failed');
 return data;
}
