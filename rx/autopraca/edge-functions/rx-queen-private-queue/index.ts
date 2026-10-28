// RX Queen private gateway — staging-only, read-only prototype.
// Deploy ONLY after configuring RX_STAGING_DATABASE_URL as an Edge Function secret.
// JWT verification must remain enabled at deployment.
import postgres from 'npm:postgres@3.4.5';

const STAGING='owkjdlpawczrnwyszduj';
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const required=(name:string)=>Deno.env.get(name)||'';

Deno.serve(async(req:Request)=>{
 if(req.method!=='GET')return json(405,{ok:false,error:'method_not_allowed'});
 const url=new URL(req.url);
 if(url.pathname!=='/rx-queen-private-queue')return json(404,{ok:false,error:'not_found'});
 const supabaseUrl=required('SUPABASE_URL');
 const anonKey=required('SUPABASE_ANON_KEY');
 const dbUrl=required('RX_STAGING_DATABASE_URL');
 if(!supabaseUrl||!anonKey||!dbUrl)return json(503,{ok:false,error:'gateway_not_configured'});
 let base:URL;
 try{base=new URL(supabaseUrl);}catch{return json(503,{ok:false,error:'invalid_configuration'});}
 if(base.origin!==`https://${STAGING}.supabase.co`||base.pathname!=='/')return json(503,{ok:false,error:'staging_only'});
 const auth=req.headers.get('Authorization')||'';
 if(!/^Bearer [A-Za-z0-9._~-]+$/.test(auth))return json(401,{ok:false,error:'authentication_required'});
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),8000);
 try{
  const userResponse=await fetch(new URL('/auth/v1/user',base),{headers:{apikey:anonKey,Authorization:auth},signal:controller.signal});
  if(!userResponse.ok)return json(401,{ok:false,error:'invalid_session'});
  const user=await userResponse.json();
  if(!user?.id||user.is_anonymous===true)return json(403,{ok:false,error:'admin_required'});
  const adminResponse=await fetch(new URL('/rest/v1/rpc/is_vexorio_admin',base),{
   method:'POST',headers:{apikey:anonKey,Authorization:auth,'Content-Type':'application/json'},body:'{}',signal:controller.signal
  });
  if(!adminResponse.ok||await adminResponse.json()!==true)return json(403,{ok:false,error:'admin_required'});
  const sql=postgres(dbUrl,{max:1,connect_timeout:5,ssl:'require',idle_timeout:1});
  try{
   const rows=await sql`select id, source, task_type, title, status, created_at, approved_at, finished_at
    from rx_private.ant_task_queue order by created_at desc limit 20`;
   return json(200,{ok:true,source:'supabase-staging',tasks:rows});
  }finally{await sql.end({timeout:1});}
 }catch{return json(503,{ok:false,error:'gateway_unavailable'});}
 finally{clearTimeout(timeout);}
});
