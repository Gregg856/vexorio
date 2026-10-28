'use strict';
// RX native math kernel: Float32 matrix multiplication for future RX model experiments.
// No external AI, network, model training, or production execution.
function matmul(a,b,m,k,n,out=new Float32Array(m*n)){
 if(![m,k,n].every(x=>Number.isSafeInteger(x)&&x>0&&x<=4096)||m*k>4e6||k*n>4e6||m*n>4e6)throw Error('Invalid matrix shape');
 if(!(a instanceof Float32Array)||!(b instanceof Float32Array)||!(out instanceof Float32Array)||a.length!==m*k||b.length!==k*n||out.length!==m*n||out===a||out===b)throw Error('Invalid matrix buffers');
 out.fill(0);
 // Cache-friendly row-wise accumulation; Float32 output rounds per accumulation.
 for(let i=0;i<m;i++){
  const row=i*n;
  for(let p=0;p<k;p++){
   const v=a[i*k+p],brow=p*n;
   let j=0;
   for(;j+3<n;j+=4){
    out[row+j]+=v*b[brow+j];
    out[row+j+1]+=v*b[brow+j+1];
    out[row+j+2]+=v*b[brow+j+2];
    out[row+j+3]+=v*b[brow+j+3];
   }
   for(;j<n;j++)out[row+j]+=v*b[brow+j];
  }
 }
 return out;
}
// Experimental tiled kernel. Explicit opt-in; baseline remains unchanged.
function matmulBlocked(a,b,m,k,n,out=new Float32Array(m*n),tile=32){
 if(![m,k,n].every(x=>Number.isSafeInteger(x)&&x>0&&x<=4096)||m*k>4e6||k*n>4e6||m*n>4e6)throw Error('Invalid matrix shape');
 if(!(a instanceof Float32Array)||!(b instanceof Float32Array)||!(out instanceof Float32Array)||a.length!==m*k||b.length!==k*n||out.length!==m*n||out===a||out===b)throw Error('Invalid matrix buffers');
 if(!Number.isSafeInteger(tile)||tile<4||tile>256)throw Error('Invalid tile size');
 out.fill(0);
 for(let ii=0;ii<m;ii+=tile)for(let pp=0;pp<k;pp+=tile)for(let jj=0;jj<n;jj+=tile){
  const iEnd=Math.min(ii+tile,m),pEnd=Math.min(pp+tile,k),jEnd=Math.min(jj+tile,n);
  for(let i=ii;i<iEnd;i++)for(let p=pp;p<pEnd;p++){
   const v=a[i*k+p],row=i*n,brow=p*n;
   let j=jj;
   for(;j+3<jEnd;j+=4){
    out[row+j]+=v*b[brow+j];out[row+j+1]+=v*b[brow+j+1];
    out[row+j+2]+=v*b[brow+j+2];out[row+j+3]+=v*b[brow+j+3];
   }
   for(;j<jEnd;j++)out[row+j]+=v*b[brow+j];
  }
 }
 return out;
}
function dot(a,b){
 if(!(a instanceof Float32Array)||!(b instanceof Float32Array)||a.length!==b.length)throw Error('Invalid vectors');
 let sum=0;for(let i=0;i<a.length;i++)sum+=a[i]*b[i];return sum;
}
module.exports={matmul,matmulBlocked,dot};
