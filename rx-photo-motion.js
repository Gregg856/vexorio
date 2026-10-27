/* RX PhotoMotion 1.0 — local slideshow renderer, not generative AI. */
(function(root){
'use strict';
async function render({files,duration=5,ratio='9:16',motion='zoom',transition='cut',caption='',captionPosition='bottom',audioFile=null,audioVolume=0.7,audioStart=0,onProgress=()=>{}}){
 if(!files||!files.length)throw Error('Dodaj zdjęcia, aby utworzyć film.');
 if(!root.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw Error('Ta przeglądarka nie obsługuje lokalnego nagrywania wideo.');
 const candidates=audioFile?['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm','video/mp4']:['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp8','video/webm;codecs=vp9'];
 const mime=candidates.find(x=>MediaRecorder.isTypeSupported(x));
 if(!mime)throw Error('Przeglądarka nie obsługuje eksportu wideo MP4 ani WebM.');
 duration=Math.min(30,Math.max(1,Math.round(Number(duration)||5)));
 const sizes={'9:16':[360,640],'16:9':[640,360],'1:1':[480,480],'4:5':[400,500]};
 const [width,height]=sizes[ratio]||sizes['9:16'];
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');
 const loaded=[];
 try{
  for(const file of Array.from(files).slice(0,30)){
   if(!file.type.startsWith('image/'))continue;
   if(file.size>25*1024*1024)throw Error('Zdjęcie jest zbyt duże (maks. 25 MB).');
   const url=URL.createObjectURL(file);
   try{const img=new Image();img.src=url;await img.decode();loaded.push(img)}finally{URL.revokeObjectURL(url)}
  }
  if(!loaded.length)throw Error('Nie udało się wczytać zdjęć.');
  // For audio+video, use a clocked capture track to keep Chromium's muxer fed.\n  // For silent clips use explicit frame requests: an image must reach the encoder even when
  // Chromium throttles automatic canvas capture in headless/background tabs.
  const stream=canvas.captureStream(audioFile?30:0);
  const videoTrack=stream.getVideoTracks()[0];
  if(!videoTrack)throw Error('Nie można przechwycić obrazu z canvas.');
  // Keep video and audio tracks alive until MediaRecorder has emitted its final data.
  let audioContext=null,audioSource=null;
  if(audioFile){
   if(!audioFile.type.startsWith('audio/'))throw Error('Wybierz plik muzyczny.');
   if(audioFile.size>30*1024*1024)throw Error('Muzyka jest zbyt duża (maks. 30 MB).');
   const AudioCtx=root.AudioContext||root.webkitAudioContext;
   if(!AudioCtx)throw Error('Przeglądarka nie obsługuje miksowania audio.');
   audioContext=new AudioCtx();
   try{
    const decoded=await audioContext.decodeAudioData(await audioFile.arrayBuffer());
    const destination=audioContext.createMediaStreamDestination(),gain=audioContext.createGain();
    gain.gain.value=Math.min(1,Math.max(0,Number(audioVolume)||0));
    audioSource=audioContext.createBufferSource();audioSource.buffer=decoded;audioSource.loop=true;audioSource.loopStart=0;audioSource.loopEnd=decoded.duration;
    audioSource.connect(gain);gain.connect(destination);
    destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
   }catch(error){await audioContext.close();stream.getTracks().forEach(track=>track.stop());throw Error('Nie można odczytać muzyki: '+error.message)}
  }
  if(!root.RXVideoEngine)throw Error('RX VIDEO ENGINE nie został załadowany.');
  const recorder=root.RXVideoEngine.create(stream,mime,{bitrate:1200000});
  const result=recorder.result;
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
   const subtitle=String(caption||'').trim().slice(0,120);
   if(subtitle){
    ctx.save();
    const fontSize=Math.max(22,Math.round(width/18));
    ctx.font='bold '+fontSize+'px system-ui,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    const words=subtitle.split(/\s+/),lines=[];let line='';
    for(const word of words){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>width*.85&&line){lines.push(line);line=word}else line=candidate}
    if(line)lines.push(line);
    const visible=lines.slice(0,3),lineHeight=fontSize*1.3;
    const boxHeight=visible.length*lineHeight+28,top=captionPosition==='top'?36:captionPosition==='center'?(height-boxHeight)/2:height-boxHeight-36;
    ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(0,top,width,boxHeight);
    ctx.fillStyle='#fff';
    visible.forEach((text,i)=>ctx.fillText(text,width/2,top+22+lineHeight*(i+.5),width*.9));
    ctx.restore();
   }
   onProgress(Math.round(t/duration*100));
  }
  draw(0);
  videoTrack.requestFrame?.();

  // Ensure the audio graph is running before recording; headless/mobile browsers
  // may keep a newly created AudioContext suspended after decoding a file.
  if(audioContext&&audioContext.state==='suspended'){
   try{await audioContext.resume()}catch(error){throw Error('Nie można uruchomić dźwięku: '+error.message)}
  }
  try{recorder.start();draw(0);videoTrack.requestFrame?.()}catch(error){stream.getTracks().forEach(track=>track.stop());throw error}
  if(audioSource){const offset=Math.max(0,Number(audioStart)||0)%audioSource.buffer.duration;audioSource.start(0,offset)}
  const start=performance.now();
  function frame(now){if(recorder.state==='inactive'){stopped=true;return}const t=Math.min(duration,(now-start)/1000);try{draw(t);videoTrack.requestFrame?.()}catch(error){stopped=true;if(recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(track=>track.stop());onProgress(0);return}if(t>=duration){stopped=true;/* Keep the canvas and audio tracks alive while the encoder flushes. */setTimeout(()=>{if(recorder.state==='recording'){try{draw(duration);videoTrack.requestFrame?.()}catch{}recorder.stop()}},500)}else frameId=requestAnimationFrame(frame)}
  frameId=requestAnimationFrame(frame);
  try{return await result}finally{if(frameId)cancelAnimationFrame(frameId);if(!stopped&&recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(track=>track.stop());if(audioSource){try{audioSource.stop()}catch{}}if(audioContext)await audioContext.close()}
 }finally{loaded.length=0}
}
root.RXPhotoMotion={render,supportedTypes:()=>root.MediaRecorder?['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp8','video/webm;codecs=vp9'].filter(t=>MediaRecorder.isTypeSupported(t)):[]};
})(window);
