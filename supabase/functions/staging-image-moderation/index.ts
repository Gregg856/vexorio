import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,apikey,content-type", "access-control-allow-methods": "POST,OPTIONS" };
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"content-type":"application/json","cache-control":"no-store"}});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 const auth=req.headers.get("authorization")||"";
 if(!/^Bearer\s+\S+$/i.test(auth))return json({error:"unauthorized"},401);
 const url=Deno.env.get("SUPABASE_URL")||"";
 const key=Deno.env.get("SUPABASE_ANON_KEY")||"";
 if(!url.startsWith("https://owkjdlpawczrnwyszduj.supabase.co")||!key)return json({error:"staging_only"},503);
 const supabase=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:userError}=await supabase.auth.getUser(auth.replace(/^Bearer\s+/i,""));
 if(userError||!user)return json({error:"unauthorized"},401);
 const {data:isAdmin,error:adminError}=await supabase.rpc("is_vexorio_admin");
 if(adminError||isAdmin!==true)return json({error:"forbidden"},403);
 const apiKey=Deno.env.get("OPENAI_API_KEY");
 if(!apiKey)return json({error:"scanner_not_configured",reviewRequired:true},503);
 let payload;
 try{payload=await req.json()}catch{return json({error:"invalid_json"},400)}
 const image=payload?.image;
 if(typeof image!=="string"||image.length>5_000_000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image))return json({error:"invalid_image"},400);
 try{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  let response;
  try{response=await fetch("https://api.openai.com/v1/moderations",{method:"POST",headers:{"authorization":"Bearer "+apiKey,"content-type":"application/json"},body:JSON.stringify({model:"omni-moderation-latest",input:[{type:"image_url",image_url:{url:image}}]}),signal:controller.signal})}finally{clearTimeout(timer)}
  if(!response.ok)return json({error:"scanner_unavailable",reviewRequired:true},502);
  const result=(await response.json()).results?.[0];
  if(!result)return json({error:"empty_scanner_result",reviewRequired:true},502);
  return json({flagged:result.flagged===true,reviewRequired:result.flagged===true,categories:result.categories||{},model:"omni-moderation-latest",note:"Advisory screening only; no automatic publishing or account ban"});
 }catch{return json({error:"scanner_timeout_or_network_error",reviewRequired:true},502)}
});