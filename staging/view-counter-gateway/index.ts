// Staging-only gateway. Requires VIEW_COUNTER_HMAC_SECRET (>=32 chars),
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and VIEW_COUNTER_ALLOWED_ORIGIN.
// Never expose server secrets to the browser.
// Same-origin proxy on the Worker is REQUIRED for reliable first-party cookies.
const json = (data: unknown, status=200, extra: HeadersInit={}) =>
  new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...extra}});
const encoder=new TextEncoder();
const hex=(a:Uint8Array)=>Array.from(a,x=>x.toString(16).padStart(2,"0")).join("");
async function mac(key:CryptoKey,message:string){
 return hex(new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(message))));
}
function parseCookie(raw:string){
 const match=raw.match(/(?:^|;\s*)vx_view=([a-f0-9]{32})\.([a-f0-9]{64})(?:;|$)/);
 return match ? {id:match[1],sig:match[2]} : null;
}
Deno.serve(async(req)=>{
 if(req.method!=="POST") return json({error:"method_not_allowed"},405);
 const origin=Deno.env.get("VIEW_COUNTER_ALLOWED_ORIGIN");
 const secret=Deno.env.get("VIEW_COUNTER_HMAC_SECRET");
 const base=Deno.env.get("SUPABASE_URL");
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!origin||!secret||secret.length<32||!base||!service) return json({error:"not_configured"},503);
 if(req.headers.get("origin")!==origin) return json({error:"forbidden_origin"},403);
 const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 let payload:unknown;
 try {payload=await req.json()}catch{return json({error:"invalid_json"},400)}
 const listingId=(payload as {listing_id?:unknown})?.listing_id;
 if(!Number.isSafeInteger(listingId)||Number(listingId)<1) return json({error:"invalid_listing"},400);
 const cookie=parseCookie(req.headers.get("cookie")||"");
 let id:string;
 let setCookie="";
 if(cookie && await mac(key,"v1:"+cookie.id)===cookie.sig){id=cookie.id}
 else{
   id=hex(crypto.getRandomValues(new Uint8Array(16)));
   const sig=await mac(key,"v1:"+id);
   setCookie="vx_view="+id+"."+sig+"; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax";
 }
 const digest=await mac(key,"listing-view:v1:"+id);
 const upstream=await fetch(base+"/rest/v1/rpc/vexorio_record_listing_view_server",{
  method:"POST",headers:{"apikey":service,"Authorization":"Bearer "+service,"content-type":"application/json"},
  body:JSON.stringify({p_listing_id:listingId,p_visitor_digest:digest})
 });
 if(!upstream.ok) return json({error:"upstream_error"},502);
 const count=await upstream.json();
 const headers:Record<string,string>={};
 if(setCookie) headers["Set-Cookie"]=setCookie;
 return json({view_count:count},200,headers);
});
