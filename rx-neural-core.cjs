'use strict';
// RX NEURAL CORE 1.0 — small deterministic educational network, trained locally.
// No network, model API, user data, autonomous deployment or production wiring.
const {matmul,relu}=require('./rx-math-core.cjs');
function validate(x,y,input,hidden,output,rate){
 if(![input,hidden,output].every(n=>Number.isSafeInteger(n)&&n>0&&n<=256))throw Error('Invalid dimensions');
 if(!(x instanceof Float32Array)||!(y instanceof Float32Array)||x.length%input!==0||x.length===0||y.length!==(x.length/input)*output)throw Error('Invalid training data');
 if(!Number.isFinite(rate)||rate<=0||rate>1)throw Error('Invalid learning rate');
 for(const a of [x,y])for(const v of a)if(!Number.isFinite(v))throw Error('Non-finite data');
}
function createNetwork(input,hidden,output){
 if(![input,hidden,output].every(n=>Number.isSafeInteger(n)&&n>0&&n<=256))throw Error('Invalid dimensions');
 const w1=new Float32Array(input*hidden),w2=new Float32Array(hidden*output);
 // Reproducible nonzero initialization, no dependency on external RNG.
 let state=123456789;
 const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 for(let i=0;i<w1.length;i++)w1[i]=(rand()*2-1)*Math.sqrt(2/input);
 for(let i=0;i<w2.length;i++)w2[i]=(rand()*2-1)*Math.sqrt(2/hidden);
 return {input,hidden,output,w1,w2,b1:new Float32Array(hidden),b2:new Float32Array(output)};
}
function forward(net,x){
 if(!(x instanceof Float32Array)||x.length!==net.input)throw Error('Invalid input');
 const z1=matmul(x,net.w1,1,net.input,net.hidden);
 for(let j=0;j<net.hidden;j++)z1[j]+=net.b1[j];
 const h=relu(z1),pred=matmul(h,net.w2,1,net.hidden,net.output);
 for(let j=0;j<net.output;j++)pred[j]+=net.b2[j];
 return {z1,h,pred};
}
// Efficient batched inference for the existing RX network; no training or network calls.
function predictBatch(net,x){
 if(!(x instanceof Float32Array)||x.length===0||x.length%net.input!==0)throw Error('Invalid batch input');
 const count=x.length/net.input;
 if(count>4096||count*net.hidden>4e6||count*net.output>4e6)throw Error('Batch too large');
 for(const v of x)if(!Number.isFinite(v))throw Error('Non-finite batch input');
 const z1=matmul(x,net.w1,count,net.input,net.hidden);
 for(let i=0;i<count;i++)for(let j=0;j<net.hidden;j++)z1[i*net.hidden+j]=Math.max(0,z1[i*net.hidden+j]+net.b1[j]);
 const predictions=matmul(z1,net.w2,count,net.hidden,net.output);
 for(let i=0;i<count;i++)for(let j=0;j<net.output;j++)predictions[i*net.output+j]+=net.b2[j];
 return predictions;
}
function loss(net,x,y){
 const count=x.length/net.input;let sum=0;
 for(let i=0;i<count;i++){
  const pred=forward(net,x.subarray(i*net.input,(i+1)*net.input)).pred;
  for(let j=0;j<net.output;j++){const e=pred[j]-y[i*net.output+j];sum+=e*e;}
 }
 return sum/(count*net.output);
}
function train(net,x,y,{epochs=100,rate=0.03}={}){
 validate(x,y,net.input,net.hidden,net.output,rate);
 if(!Number.isSafeInteger(epochs)||epochs<1||epochs>10000)throw Error('Invalid epochs');
 const count=x.length/net.input,initialLoss=loss(net,x,y);
 for(let epoch=0;epoch<epochs;epoch++)for(let i=0;i<count;i++){
  const xi=x.subarray(i*net.input,(i+1)*net.input);
  const {z1,h,pred}=forward(net,xi),delta2=new Float32Array(net.output),delta1=new Float32Array(net.hidden);
  for(let j=0;j<net.output;j++)delta2[j]=2*(pred[j]-y[i*net.output+j])/net.output;
  // Compute hidden gradient BEFORE modifying second-layer weights.
  for(let j=0;j<net.hidden;j++){
   let g=0;for(let o=0;o<net.output;o++)g+=net.w2[j*net.output+o]*delta2[o];
   delta1[j]=z1[j]>0?g:0;
  }
  for(let j=0;j<net.hidden;j++)for(let o=0;o<net.output;o++)net.w2[j*net.output+o]-=rate*h[j]*delta2[o];
  for(let o=0;o<net.output;o++)net.b2[o]-=rate*delta2[o];
  for(let j=0;j<net.input;j++)for(let k=0;k<net.hidden;k++)net.w1[j*net.hidden+k]-=rate*xi[j]*delta1[k];
  for(let k=0;k<net.hidden;k++)net.b1[k]-=rate*delta1[k];
 }
 return {initialLoss,finalLoss:loss(net,x,y),epochs,count};
}
module.exports={createNetwork,forward,predictBatch,loss,train};
