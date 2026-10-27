/* RX VIDEO ENGINE 1.0 — isolated browser MediaRecorder lifecycle. */
(function(root){
'use strict';
function create(stream,mime,{bitrate=1200000}={}){
 if(!stream||!stream.getVideoTracks().length)throw Error('RX VIDEO: brak ścieżki obrazu');
 const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:bitrate});
 const chunks=[];let events=0,settled=false;
 const result=new Promise((resolve,reject)=>{
  recorder.ondataavailable=e=>{events++;if(e.data&&e.data.size>0)chunks.push(e.data)};
  recorder.onerror=e=>{if(!settled){settled=true;reject(e.error||Error('RX VIDEO: błąd kodera'))}};
  recorder.onstop=()=>{
   if(settled)return;settled=true;
   const blob=new Blob(chunks,{type:recorder.mimeType||mime});
   if(!blob.size)return reject(Error('RX VIDEO: pusty eksport; '+JSON.stringify({mime,events,parts:chunks.length,audioTracks:stream.getAudioTracks().length,videoState:stream.getVideoTracks()[0]?.readyState})));
   resolve(blob);
  };
 });
 function start(){if(recorder.state!=='inactive')throw Error('RX VIDEO: nagrywanie już trwa');recorder.start(250)}
 function stop(){if(recorder.state==='recording')recorder.stop()}
 return Object.freeze({start,stop,result,get state(){return recorder.state}});
}
root.RXVideoEngine=Object.freeze({create});
})(window);
