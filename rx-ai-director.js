/* RX AI Director 1.0: deterministic, local storyboard planner. No generative AI calls. */
(function(root){
'use strict';
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const clean=s=>String(s||'').trim().replace(/\s+/g,' ');
const uid=()=> 'rx-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const SHOTS=['Ujęcie otwierające','Ujęcie główne','Zbliżenie','Ujęcie końcowe'];
function plan(input){
 if(!input||typeof input!=='object')throw Error('Nieprawidłowe dane projektu');
 const prompt=clean(input.prompt);
 if(!prompt||prompt.length>4000)throw Error('Polecenie musi mieć od 1 do 4000 znaków');
 const type=['image','text-video','image-video'].includes(input.type)?input.type:null;
 if(!type)throw Error('Nieznany rodzaj projektu');
 const ratio=['9:16','16:9','1:1','4:5'].includes(input.aspect_ratio)?input.aspect_ratio:'9:16';
 const duration=type==='image'?null:clamp(Math.floor(Number(input.duration_seconds)||5),1,30);
 const count=duration===null?1:Math.min(4,Math.max(1,Math.ceil(duration/8)));
 const base=Math.floor((duration||1)/count),remainder=(duration||1)%count;
 const photos=Array.isArray(input.input_files)?input.input_files.filter(f=>f&&typeof f.name==='string').slice(0,30):[];
 if(type==='image-video'&&!photos.length)throw Error('Dodaj zdjęcie');
 let start=0;
 const scenes=Array.from({length:count},(_,i)=>{const seconds=base+(i<remainder?1:0),scene={index:i+1,title:SHOTS[i],start_seconds:start,duration_seconds:seconds,prompt:prompt,camera:i===0?'szeroki plan':i===count-1?'powolne oddalenie':'płynny najazd',source_photo:photos.length?photos[i%photos.length].name:null};start+=seconds;return scene});
 return {id:uid(),version:1,engine:'RX AI Director 1.0',type,prompt,aspect_ratio:ratio,duration_seconds:duration,scenes,source_files:photos,state:'storyboard_ready',render_status:'AI renderer not connected',created_at:new Date().toISOString()};
}
root.RXDirector={plan};
})(typeof window!=='undefined'?window:globalThis);
