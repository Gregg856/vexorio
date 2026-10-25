/* RX PhotoMotion 1.0 — local slideshow renderer, not generative AI. */
(function(root){
'use strict';
async function render({files,duration=5,ratio='9:16',motion='zoom',transition='cut',onProgress=()=>{}}){
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
   const progress=Math.min(1,Math.max(0,local));
   const baseScale=Math.max(width/img.width,height/img.height);
   const factor=motion==='pan'?1.10:motion==='static'?1:1+0.10*progress;
   const w=img.width*baseScale*factor,h=img.height*baseScale*factor;
   const pan=motion==='pan'?(progress-.5)*Math.max(0,w-width)*0.7:0;
   ctx.drawImage(img,(width-w)/2-pan,(height-h)/2,w,h);
   if(transition==='fade'&&loaded.length>1){
    const fade=Math.min(0.35,1/loaded.length);
    if(progress>1-fade&&index<loaded.length-1){
     const other=loaded[index+1],alpha=(progress-(1-fade))/fade;
     const nextScale=Math.max(width/other.width,height/other.height);
     const nextW=other.width*nextScale,nextH=other.height*nextScale;
     ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
     ctx.drawImage(other,(width-nextW)/2,(height-nextH)/2,nextW,nextH);
     ctx.globalAlpha=1;
    }
   }
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
