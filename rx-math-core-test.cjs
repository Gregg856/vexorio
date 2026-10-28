'use strict';
const assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
const {matmul,matmulBlocked,dot}=require('./rx-math-core.cjs');
function reference(a,b,m,k,n){const out=new Float32Array(m*n);for(let i=0;i<m;i++)for(let j=0;j<n;j++){let v=0;for(let p=0;p<k;p++)v+=a[i*k+p]*b[p*n+j];out[i*n+j]=v;}return out;}
for(const [m,k,n] of [[1,1,1],[2,3,4],[8,5,7],[32,32,32]]){
 const a=Float32Array.from({length:m*k},(_,i)=>((i*17)%29-14)/16);
 const b=Float32Array.from({length:k*n},(_,i)=>((i*11)%23-11)/16);
 const got=matmul(a,b,m,k,n),expected=reference(a,b,m,k,n);
 for(let i=0;i<got.length;i++)assert.ok(Math.abs(got[i]-expected[i])<0.0001, 'Mismatch '+m+','+k+','+n+' index '+i);
}
assert.equal(dot(new Float32Array([1,2,3]),new Float32Array([4,5,6])),32);
assert.throws(()=>matmul(new Float32Array(2),new Float32Array(2),2,2,2));
const size=64,a=Float32Array.from({length:size*size},(_,i)=>(i%19)/19),b=Float32Array.from({length:size*size},(_,i)=>(i%13)/13),out=new Float32Array(size*size);
function bench(fn){for(let i=0;i<8;i++)fn();const times=[];for(let r=0;r<7;r++){const t=performance.now();for(let i=0;i<12;i++)fn();times.push((performance.now()-t)/12);}times.sort((a,b)=>a-b);return times[3];}
const nativeMs=bench(()=>matmul(a,b,size,size,size,out));
const referenceMs=bench(()=>reference(a,b,size,size,size));
// RX TURBO TEST: bounded stress cases and paired per-size performance checks.
const turbo=[];
for(const n of [64,128,256]){
 const x=Float32Array.from({length:n*n},(_,i)=>((i*7)%31-15)/31);
 const y=Float32Array.from({length:n*n},(_,i)=>((i*13)%37-18)/37);
 const dest=new Float32Array(n*n);
 const actual=matmul(x,y,n,n,n,dest),expected=reference(x,y,n,n,n);
 let maxAbsError=0;
 for(let i=0;i<actual.length;i++)maxAbsError=Math.max(maxAbsError,Math.abs(actual[i]-expected[i]));
 assert.ok(maxAbsError<0.001,'RX TURBO numerical mismatch at '+n+': '+maxAbsError);
 const rounds=n>=256?3:n>=128?5:9;
 function timed(fn){const samples=[];for(let warm=0;warm<3;warm++)fn();for(let run=0;run<5;run++){const start=performance.now();for(let i=0;i<rounds;i++)fn();samples.push((performance.now()-start)/rounds);}samples.sort((a,b)=>a-b);return samples[2];}
 const native=timed(()=>matmul(x,y,n,n,n,dest));
 const baseline=timed(()=>reference(x,y,n,n,n));
 turbo.push({size:n,correctness:'passed',maxAbsError,nativeMedianMs:native,referenceMedianMs:baseline,ratio:native/baseline});
}
// Compare blocked variants against the same baseline on identical inputs.
const blockedResults=[];
for(const n of [128,256]){
 const a=Float32Array.from({length:n*n},(_,i)=>((i*7)%31-15)/31);
 const b=Float32Array.from({length:n*n},(_,i)=>((i*13)%37-18)/37);
 const expected=matmul(a,b,n,n,n),out=new Float32Array(n*n);
 for(const tile of [16,32,64]){
  matmulBlocked(a,b,n,n,n,out,tile);
  let maxAbsError=0;
  for(let i=0;i<out.length;i++)maxAbsError=Math.max(maxAbsError,Math.abs(out[i]-expected[i]));
  assert.ok(maxAbsError<0.001,'Blocked mismatch at '+n+' tile '+tile+': '+maxAbsError);
  const samples=[];for(let warm=0;warm<3;warm++)matmulBlocked(a,b,n,n,n,out,tile);
  for(let run=0;run<5;run++){const start=performance.now();for(let rep=0;rep<3;rep++)matmulBlocked(a,b,n,n,n,out,tile);samples.push((performance.now()-start)/3);}
  samples.sort((x,y)=>x-y);
  blockedResults.push({size:n,tile,maxAbsError,medianMs:samples[2]});
 }
}
console.log(JSON.stringify({kind:'rx-math-blocked-comparison',results:blockedResults,note:'Experimental tiled kernel only; no automatic promotion'},null,2));
console.log(JSON.stringify({kind:'rx-math-turbo-test',results:turbo,note:'Bounded CI microbenchmarks, not proof of production throughput'},null,2));
console.log(JSON.stringify({kind:'rx-math-core-benchmark',matrix:size,correctness:'passed',nativeMedianMs:nativeMs,referenceMedianMs:referenceMs,ratio:nativeMs/referenceMs,note:'Local Node microbenchmark, not production or cross-machine comparison'},null,2));
