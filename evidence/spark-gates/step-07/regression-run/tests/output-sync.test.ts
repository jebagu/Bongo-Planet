import {afterEach,expect,it,vi} from 'vitest';
import {OutputAdapter} from '../src/output/OutputAdapter';
import {emptyLegacyScene as emptyScene,newPiece} from '../src/core/contracts';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
function environment(){
 vi.useFakeTimers();let time=1000;
 vi.spyOn(performance,'now').mockImplementation(()=>time);
 vi.stubGlobal('window',{setInterval:()=>1});
 const sockets:Socket[]=[];
 class Socket{
  static OPEN=1;readyState=1;bufferedAmount=0;sent:Record<string,any>[]=[];
  onopen:(()=>void)|null=null;onmessage:((event:{data:string})=>void)|null=null;onclose:(()=>void)|null=null;onerror:(()=>void)|null=null;
  constructor(){sockets.push(this);}send(data:string){this.sent.push(JSON.parse(data));}
  close=vi.fn(()=>{this.readyState=3;this.onclose?.();});
 }
 vi.stubGlobal('WebSocket',Socket);
 const adapter=new OutputAdapter(()=>0),scene=emptyScene();scene.pieces=[newPiece('note',0,'n')];adapter.setScene(scene,'load');adapter.connect();
 const socket=sockets[0];socket.onopen!();
 return {adapter,socket,advance:(ms:number)=>{time+=ms;},reply:(sample:Record<string,any>)=>socket.onmessage!({data:JSON.stringify(sample)})};
}

it('uses the tightest independent interval from eight probes before starting one session',()=>{
 const e=environment();
 for(const delay of [10,4,12,2,8,3,6,14]){
  expect(e.socket.sent.filter(packet=>packet.type==='start')).toHaveLength(0);
  const probe=e.socket.sent.at(-1)!;expect(probe.type).toBe('sync');
  e.advance(delay);e.reply({version:1,type:'sync',t0:probe.t0,server:probe.t0+3+delay/4000});
 }
 expect(e.socket.sent.filter(packet=>packet.type==='sync')).toHaveLength(8);
 expect(e.socket.sent.filter(packet=>packet.type==='start')).toHaveLength(1);
 expect(e.adapter.diagnostics.uncertaintyMs).toBeCloseTo(2,8);
 expect(e.adapter.diagnostics.clockSynchronization).toHaveLength(8);
 const startCount=e.socket.sent.length;
 e.reply({version:1,type:'sync',t0:0,server:100});
 expect(e.socket.sent).toHaveLength(startCount);
 e.adapter.event({type:'trigger',trigger:{session:'engine',sequence:1,id:'t-1',generatorId:'g',nodeId:'n',emission:0,beat:1,onset:.5,angle:0,position:[1,0,0],sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.5}}});
 expect(e.socket.sent.find(packet=>packet.type==='trigger')!.onset).toBeCloseTo(4.5585,8);
 e.adapter.dispose();
});

it('retains a timestamp allowance even when rounded clocks show a zero round trip',()=>{
 const e=environment();for(let i=0;i<8;i++){const probe=e.socket.sent.at(-1)!;e.reply({type:'sync',t0:probe.t0,server:probe.t0+3});}
 expect(e.adapter.diagnostics.uncertaintyMs).toBe(1);
 expect(e.socket.sent.filter(packet=>packet.type==='start')).toHaveLength(1);e.adapter.dispose();
});

it('disconnects rather than starts when a synchronization reply is invalid',()=>{
 const e=environment();e.reply({version:1,type:'sync',t0:999,server:3});
 expect(e.socket.close).toHaveBeenCalled();
 expect(e.socket.sent.some(packet=>packet.type==='start')).toBe(false);
 expect(e.adapter.diagnostics.connected).toBe(false);e.adapter.dispose();
});

it('times out an unanswered probe and never admits musical controls before calibration',()=>{
 const e=environment();vi.advanceTimersByTime(2001);
 expect(e.socket.close).toHaveBeenCalledWith(1000,'clock synchronization timeout');
 expect(e.socket.sent.some(packet=>packet.type==='start')).toBe(false);
 expect(e.adapter.diagnostics.connected).toBe(false);e.adapter.dispose();
});
