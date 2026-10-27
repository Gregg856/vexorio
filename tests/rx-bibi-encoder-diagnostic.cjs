'use strict';
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage();
 const results=[];
 try{
  await page.goto('about:blank');
  for(const withAudio of [false,true]){
   const r=await page.evaluate(async withAudio=>{
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;
    const ctx=canvas.getContext('2d');const stream=canvas.captureStream(0);
    const track=stream.getVideoTracks()[0];let audioContext=null,osc=null;
    if(withAudio){
     audioContext=new AudioContext();
     const dest=audioContext.createMediaStreamDestination();
     osc=audioContext.createOscillator();osc.frequency.value=440;osc.connect(dest);osc.start();
     stream.addTrack(dest.stream.getAudioTracks()[0]);
     if(audioContext.state==='suspended')await audioContext.resume();
    }
    const mime=withAudio?'video/webm;codecs=vp8,opus':'video/webm;codecs=vp8';
    if(!MediaRecorder.isTypeSupported(mime))return {withAudio,unsupported:true};
    const recorder=new MediaRecorder(stream,{mimeType:mime});
    let bytes=0,events=0;
    const done=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{events++;bytes+=e.data.size};recorder.onerror=e=>reject(e.error||Error('Recorder error'));recorder.onstop=resolve});
    recorder.start(250);
    for(let i=0;i<24;i++){
     ctx.fillStyle=i%2?'#1155cc':'#cc5511';ctx.fillRect(0,0,320,240);
     ctx.fillStyle='#ffffff';ctx.fillText(String(i),20,30);
     track.requestFrame?.();
     await new Promise(resolve=>setTimeout(resolve,50));
    }
    recorder.stop();await done;
    stream.getTracks().forEach(t=>t.stop());
    if(osc)osc.stop();
    if(audioContext)await audioContext.close();
    return {withAudio,bytes,events,ok:bytes>0};
   },withAudio);
   results.push(r);
   console.log('RX BIBI ENCODER DIAGNOSTIC:',JSON.stringify(r));
  }
 }finally{await browser.close()}
 const fs=require('node:fs');fs.mkdirSync('rx-bibi-reports',{recursive:true});fs.writeFileSync('rx-bibi-reports/encoder-diagnostic.json',JSON.stringify(results,null,2)+'\n');
 if(results.some(x=>!x.ok&&!x.unsupported))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
