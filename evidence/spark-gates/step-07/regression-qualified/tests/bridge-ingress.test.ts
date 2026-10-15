import {expect,it} from 'vitest';
import {WebSocket} from 'ws';
import {createBridge} from '../src/output/bridge';

it('admits a position burst while servicing native acknowledgements and preserves every OSC position',async()=>{
 const bridge=createBridge(0,0,{nativeClock:true});
 let socket:WebSocket|undefined;
 const errors:string[]=[];
 const until=async(predicate:()=>boolean)=>{
  const deadline=performance.now()+3000;
  while(!predicate()){
   if(errors.length)throw Error(errors.join('\n'));
   if(performance.now()>=deadline)throw Error('Position burst observation timed out');
   await new Promise(resolve=>setTimeout(resolve,2));
  }
 };
 try{
  const port=await bridge.start();
  socket=new WebSocket(`ws://127.0.0.1:${port}`,{origin:'http://127.0.0.1:5417',perMessageDeflate:true});
  socket.on('error',error=>errors.push(String(error)));
  socket.on('message',data=>errors.push(data.toString()));
  await new Promise<void>((resolve,reject)=>{socket!.once('open',resolve);socket!.once('error',reject);});
  expect(socket.extensions).toBe('');
  const send=(packet:Record<string,unknown>)=>socket!.send(JSON.stringify({version:1,session:'ingress-regression',...packet}));
  const acknowledged=()=>{const clock=bridge.state().clock;return 'unacknowledgedCommands' in clock&&clock.unacknowledgedCommands===0;};
  send({type:'start',sequence:0});
  const expected:{objectId:number;nodeId:string;position:number[]}[]=[];
  const position=(sequence:number)=>{
   const objectId=(sequence-1)%92+1,nodeId=`ingress-node-${objectId}`;
   const xyz=sequence%2?[1,0,0]:[0,1,0];
   expected.push({objectId,nodeId,position:xyz});
   send({type:'position',sequence,objectId,nodeId,position:xyz,sent:performance.now()/1000});
  };
  for(let sequence=1;sequence<=92;sequence++)position(sequence);
  send({type:'heartbeat'});
  await until(()=>bridge.raw.length===92&&acknowledged());
  for(let sequence=93;sequence<=1292;sequence++){
   position(sequence);
   if((sequence-93)%64===0)send({type:'heartbeat'});
  }
  await until(()=>bridge.raw.length===1292&&acknowledged());
  expect(errors).toEqual([]);
  expect(bridge.state()).toMatchObject({session:'ingress-regression',drops:0,clock:{ready:true,unacknowledgedBytes:0}});
  expect(bridge.records.filter(row=>row.type==='position').map(({objectId,nodeId,position})=>({objectId,nodeId,position}))).toEqual(expected);
  expect(bridge.raw.map(({objectId,address,position})=>({objectId,address,position}))).toEqual(expected.map(row=>({objectId:row.objectId,address:`/adm/obj/${row.objectId}/xyz`,position:row.position})));
  const latest=new Map(expected.map(row=>[row.objectId,row]));
  expect(bridge.state().objects.map(({objectId,nodeId,position})=>({objectId,nodeId,position}))).toEqual([...latest.values()]);
 }finally{
  socket?.terminate();
  await bridge.close();
 }
},15000);
