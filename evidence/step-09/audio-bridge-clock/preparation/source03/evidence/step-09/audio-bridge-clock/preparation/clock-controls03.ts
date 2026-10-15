import assert from 'node:assert/strict';
import './clock-controls02';
import {writeThenCheck} from './clock-persistence03';
// An independently declared writer actually changes the synthetic clock or
// throws, rather than supplying a prevalidated outcome to a disposition mirror.
let passed=0;
for(const [after,expect]of [[279999.999,true],[280000,false],[280000.001,false]] as const){let now=279999,calls=0,bytes='';const v=writeThenCheck(()=>{calls++;bytes='provisional report';now=after;},()=>now,280000);assert.equal(calls,1);assert.equal(bytes,'provisional report');assert.equal(v.persisted,true);assert.equal(v.afterMs,after);assert.equal(v.budgetPassed,expect);passed++;}
let bytes='',calls=0;const writerError=Error('partial writer failure');const failed=writeThenCheck(()=>{calls++;bytes='retained failed prefix';throw writerError;},()=>279999,280000);assert.equal(calls,1);assert.equal(bytes,'retained failed prefix');assert.equal(failed.persisted,false);assert.equal(failed.error,writerError);assert.equal(failed.budgetPassed,false);passed++;
for(const after of [NaN,Infinity]){const v=writeThenCheck(()=>{},()=>after,280000);assert.equal(v.budgetPassed,false);assert(v.error);passed++;}
const getterError=Error('post-write clock fault'),unknown=writeThenCheck(()=>{},()=>{throw getterError;},280000);assert.equal(unknown.persisted,true);assert.equal(unknown.afterMs,null);assert.equal(unknown.error,getterError);assert.equal(unknown.budgetPassed,false);passed++;
const invalidEnd=writeThenCheck(()=>{},()=>1,NaN);assert.equal(invalidEnd.budgetPassed,false);assert(invalidEnd.error);passed++;
// Successful main persistence cannot exempt a later terminal write/check from
// the same ceiling. Neither write overwrites the first immutable report.
for(const final of [280000,280001]){let now=279999;const files:string[]=[];const main=writeThenCheck(()=>files.push('report'),()=>now,280000);assert.equal(main.budgetPassed,true);const terminal=writeThenCheck(()=>{files.push('terminal');now=final;},()=>now,280000);assert.deepEqual(files,['report','terminal']);assert.equal(terminal.budgetPassed,false);passed++;}
console.log(JSON.stringify({title:'Bongo Planet clock Source03 persistence pure controls',additionalPassed:passed,priorPassed:67,passed:passed+67,failures:0,scope:'Mock writers and synthetic clocks only; no file/runtime acquisition'}));
