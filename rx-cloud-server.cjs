'use strict';
// RX CLOUD 2.0 — self-hosted Node.js adapter for the EXISTING VEXORIO Worker.
// This is a real HTTP server, not cloud provisioning. Requires Node.js >=22.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, 'public');
const startedAt = Date.now();
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json'};
async function staticFetch(request) {
  const url = new URL(request.url);
  let name;
  try { name = decodeURIComponent(url.pathname); } catch { return new Response('Bad request',{status:400}); }
  if(name.includes('\\') || name.includes('\\0') || name.split('/').includes('..')) return new Response('Forbidden',{status:403});
  if(name.includes('\0')) return new Response('Bad request',{status:400});
  const segments=name.split('/').filter(Boolean);
  if(segments.some(part=>part.startsWith('.') || /(?:secret|credential|private|backup|token|password|\.env)/i.test(part))) return new Response('Forbidden',{status:403});
  const allowed=new Set(['.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.ico','.json','.txt','.webmanifest']);
  if(name!=='/' && !name.endsWith('/') && !allowed.has(path.posix.extname(name).toLowerCase())) return new Response('Forbidden',{status:403});
  if(name==='/' || name.endsWith('/')) name += 'index.html';
  const full = path.resolve(root, '.' + name);
  if(!full.startsWith(root + path.sep)) return new Response('Forbidden',{status:403});
  try {
    const stat = await fs.lstat(full);
    if(stat.isSymbolicLink()) return new Response('Forbidden',{status:403});
    const realRoot = await fs.realpath(root);
    const realFull = await fs.realpath(full);
    if(!realFull.startsWith(realRoot + path.sep)) return new Response('Forbidden',{status:403});
    if(!stat.isFile()) return new Response('Not found',{status:404});
    const data = await fs.readFile(full);
    const headers = {'Content-Type':types[path.extname(full).toLowerCase()] || 'application/octet-stream','X-Content-Type-Options':'nosniff'};
    if(request.method==='HEAD') return new Response(null,{status:200,headers});
    return new Response(data,{status:200,headers});
  } catch(e) { if(e.code==='ENOENT'||e.code==='ENOTDIR') return new Response('Not found',{status:404}); throw e; }
}
async function start({port=Number(process.env.PORT||8787),host=process.env.HOST||'127.0.0.1'}={}) {
  if(!Number.isInteger(port)||port<0||port>65535) throw Error('Invalid port');
  const supabaseUrl=process.env.SUPABASE_URL||'';
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl)) throw Error('RX CLOUD requires an explicit SUPABASE_URL; refusing to start without staging configuration');
  const {default:worker} = await import(pathToFileURL(path.join(__dirname,'worker.js')).href);
  const env = {ASSETS:{fetch:staticFetch},SUPABASE_URL:supabaseUrl,SUPABASE_ANON_KEY:process.env.SUPABASE_ANON_KEY||'',RX_ADMIN_USER_ID:process.env.RX_ADMIN_USER_ID||'',RX_GITHUB_DISPATCH_TOKEN:process.env.RX_GITHUB_DISPATCH_TOKEN||'',VIEW_COUNT_ENABLED:process.env.VIEW_COUNT_ENABLED||'false',VIEW_COUNT_SECRET:process.env.VIEW_COUNT_SECRET||'',SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY||'',RX_AI_ENABLED:'false'};
  const server=http.createServer(async(req,res)=>{
    try {
      const origin='http://'+(req.headers.host||'localhost');
      const url=new URL(req.url||'/',origin);
      if(url.pathname==='/__rxcloud/health') {res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,service:'rx-cloud-2',runtime:'node',uptimeSeconds:Math.floor((Date.now()-startedAt)/1000)}));return;}
      const chunks=[];let total=0;
      for await(const chunk of req){total+=chunk.length;if(total>2*1024*1024){res.writeHead(413);res.end();return;}chunks.push(chunk);}
      const headers=new Headers();
      for(const [key,val] of Object.entries(req.headers)) if(val!==undefined) headers.set(key,Array.isArray(val)?val.join(', '):val);
      const method=req.method||'GET';
      const request=new Request(url,{method,headers,body:['GET','HEAD'].includes(method)?undefined:Buffer.concat(chunks)});
      const response=await worker.fetch(request,env);
      res.writeHead(response.status,Object.fromEntries(response.headers));
      if(method==='HEAD'||!response.body){res.end();return;}
      for await(const chunk of response.body) res.write(chunk);
      res.end();
    }catch(e){console.error('RX CLOUD request failed:',e?.name||'Error');if(!res.headersSent)res.writeHead(500,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end('Internal server error');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  return server;
}
if(require.main===module)start().then(s=>{console.log('RX CLOUD listening on '+JSON.stringify(s.address()));const shutdown=()=>s.close(()=>process.exit(0));process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);}).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={start,staticFetch};
