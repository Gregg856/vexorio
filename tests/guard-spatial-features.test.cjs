'use strict';
const assert=require('node:assert/strict');
const {extractSpatialFeatures}=require('../guard/spatial-features.cjs');
const rgb=new Uint8Array(3*3*3);
for(let i=0;i<9;i++){rgb[i*3]=i*28;rgb[i*3+1]=i*28;rgb[i*3+2]=i*28}
const result=extractSpatialFeatures({width:3,height:3,channels:3,data:rgb});
assert.equal(result.grid.length,9);
for(let i=0;i<9;i++)assert.ok(Math.abs(result.grid[i]-i*28/255)<1e-12);
assert.equal(result.classification,'unknown');
assert.equal(result.requiresHumanReview,true);
const transparent=extractSpatialFeatures({width:1,height:1,data:Uint8Array.from([0,0,0,0])});
assert.equal(transparent.grid[0],1);
assert.equal(transparent.grid.filter(x=>x===null).length,8);
assert.throws(()=>extractSpatialFeatures({width:3,height:3,channels:3,data:new Uint8Array(3)}),/Invalid pixel buffer/);
assert.throws(()=>extractSpatialFeatures({width:12000,height:12000,data:new Uint8Array(0)}),/Pixel limit exceeded/);
console.log('PASS: Guard spatial grid, transparency compositing, input bounds');
