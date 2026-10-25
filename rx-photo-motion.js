/* RX PhotoMotion 1.0 — local slideshow renderer, not generative AI. */
(function(root){
'use strict';
async function render({files,duration=5,ratio='9:16',onProgress=()=>{}}){
 if(!files||!files.length)throw Error('Dodaj zdjęcia, aby utworzyć film.');
 if(!root.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw Error('Ta przeglądarka nie obsługuje lokalnego nagrywania wideo.');
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
 if(!mime)throw Error('Przeglądarka nie obsługuje eksportu WebM.');
 duration=Math.min(30,Math.max(1,Math.round(Number(duration)||5)));
 const sizes={'9:16':[540,960],'16:9':[960,540],'1:1':[720,720],'4:5':[640,800]};
 const [width,height]=sizes[ratio]||sizes['9:16'];
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');
 const loaded=[];
 try{
  for(const file of Array.from(files).slice(0,30)){
   if(!file.type.startsWith('image/'))continue;
   const url=URL.createObjectURL(file);
   try{const img=new Image();img.src=url;await img.decode();loaded.push(img)}finally{URL.revokeObjectURL(url)}
  }
  if(!loaded.length)throw Error('Nie udało się wczytać zdjęć.');
  const stream=canvas.captureStream(24),chunks=[];
  const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000});
  const result=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onerror=e=>reject(e.error||new Error('Błąd nagrywania'));recorder.onstop=()=>resolve(new Blob(chunks,{type:mime}))});
  let frameId,stopped=false;
  function draw(t){
   const index=Math.min(loaded.length-1,Math.floor(t/duration*loaded.length));
   const img=loaded[index],local=(t*loaded.length/duration)%1;
   ctx.fillStyle='#080d18';ctx.fillRect(0,0,width,height);
   const scale=Math.max(width/img.width,height/img.height)*(1+0.045*local);
   const w=img.width*scale,h=img.height*scale;
   ctx.drawImage(img,(width-w)/2,(height-h)/2,w,h);
   onProgress(Math.round(t/duration*100));
  }
  draw(0);recorder.start(250);
  const start=performance.now();
  function frame(now){const t=Math.min(duration,(now-start)/1000);draw(t);if(t>=duration){stopped=true;recorder.stop();stream.getTracks().forEach(track=>track.stop())}else frameId=requestAnimationFrame(frame)}
  frameId=requestAnimationFrame(frame);
  try{return await result}finally{if(frameId)cancelAnimationFrame(frameId);if(!stopped&&recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(track=>track.stop())}
 }finally{loaded.length=0}
}
root.RXPhotoMotion={render};
})(window);
