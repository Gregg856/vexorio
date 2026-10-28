'use strict';
const assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
const {matmul,dot}=require('./rx-math-core.cjs');
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
console.log(JSON.stringify({kind:'rx-math-core-benchmark',matrix:size,correctness:'passed',nativeMedianMs:nativeMs,referenceMedianMs:referenceMs,ratio:nativeMs/referenceMs,note:'Local Node microbenchmark, not production or cross-machine comparison'},null,2));
