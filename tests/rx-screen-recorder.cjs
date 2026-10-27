'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const elements=Object.fromEntries(['status','start','stop','download','preview','mic'].map(id=>[id,{id,hidden:true,disabled:false,checked:false,textContent:'',addEventListener(){}}]));
const document={getElementById:id=>elements[id]};
const window={addEventListener(){},MediaRecorder:function(){}};
const navigator={mediaDevices:{getDisplayMedia:async()=>{throw Error('Odmowa dostępu do ekranu')}}};
vm.runInNewContext(fs.readFileSync('rx-screen-recorder.js','utf8'),{document,window,navigator,URL,MediaStream:class{},console});
assert.equal(typeof elements.start.onclick,'function');
assert.equal(typeof elements.stop.onclick,'function');
(async()=>{await elements.start.onclick();assert.match(elements.status.textContent,/Odmowa dostępu/);assert.equal(elements.start.disabled,false);assert.equal(elements.stop.disabled,true);console.log('PASS RX Screen Recorder: script initialization and denied permission cleanup')})().catch(e=>{console.error(e);process.exitCode=1});

async function testMixedAudio(){
 const els=Object.fromEntries(['status','start','stop','download','preview','mic'].map(id=>[id,{id,hidden:true,disabled:false,checked:id==='mic',textContent:'',addEventListener(){}}]));
 let mixedConnections=0,stoppedTracks=0,closed=0;
 const track=(kind)=>({kind,stop(){stoppedTracks++},addEventListener(){}});
 const screenVideo=track('video'),screenAudio=track('audio'),micAudio=track('audio'),mixedAudio=track('audio');
 class Stream{
  constructor(tracks=[]){this.tracks=tracks}
  getTracks(){return this.tracks}
  getVideoTracks(){return this.tracks.filter(t=>t.kind==='video')}
  getAudioTracks(){return this.tracks.filter(t=>t.kind==='audio')}
 }
 class AudioContext{
  createMediaStreamDestination(){return {stream:new Stream([mixedAudio])}}
  createMediaStreamSource(){return {connect(){mixedConnections++}}}
  async resume(){}
  async close(){closed++}
 }
 class Recorder{
  static isTypeSupported(){return true}
  constructor(output,opts){this.output=output;this.mimeType=opts.mimeType;this.state='inactive';Recorder.latest=this}
  start(){this.state='recording'}
  stop(){this.state='inactive';this.ondataavailable({data:new Blob(['recorded'])});this.onstop()}
 }
 const screen=new Stream([screenVideo,screenAudio]),mic=new Stream([micAudio]);
 const nav={mediaDevices:{getDisplayMedia:async()=>screen,getUserMedia:async()=>mic}};
 const win={addEventListener(){},MediaRecorder:Recorder,AudioContext};
 const urls={createObjectURL:()=> 'blob:recorded',revokeObjectURL(){}};
 vm.runInNewContext(fs.readFileSync('rx-screen-recorder.js','utf8'),{document:{getElementById:id=>els[id]},window:win,navigator:nav,MediaStream:Stream,MediaRecorder:Recorder,URL:urls,Blob,console});
 await els.start.onclick();
 assert.equal(Recorder.latest.state,'recording');
 assert.equal(mixedConnections,2,'screen audio and microphone must both connect to mixer');
 assert.equal(Recorder.latest.output.getAudioTracks().length,1,'one mixed audio track');
 assert.equal(Recorder.latest.output.getAudioTracks()[0],mixedAudio);
 assert.equal(Recorder.latest.output.getVideoTracks()[0],screenVideo);
 els.stop.onclick();
 assert.equal(els.download.hidden,false);
 assert.match(els.status.textContent,/Nagranie gotowe/);
 assert.equal(stoppedTracks,3,'release screen and microphone tracks');
 assert.equal(closed,1,'close audio mixer');
 console.log('PASS RX Screen Recorder: screen audio + mic mixing, output and cleanup');
}
testMixedAudio().catch(e=>{console.error(e);process.exitCode=1});
