import {afterEach,describe,expect,it,vi} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {OutputAdapter} from '../src/output/OutputAdapter';
import {emptyScene,newPiece,type EngineEvent,type Scene,type Vec3} from '../src/core/contracts';

type Packet=Record<string,unknown>;
type Trace={name:string;scope:string;rows:unknown[]};
const traces:Trace[]=[];
const disposers:(()=>void)[]=[];
const LIMIT=65536;

afterEach(()=>{
  // Retain the observed failure trace before disposal's intentional disconnect.
  const directory=process.env.BONGO_OUTPUT_MOVEMENT_EVIDENCE;
  if(directory)for(const trace of traces){
    const file=path.join(directory,`${trace.name}.json`);
    if(fs.existsSync(file))throw Error(`Refusing to overwrite retained trace ${file}`);
    fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(file,JSON.stringify(trace,null,2)+'\n');
  }
  traces.length=0;for(const dispose of disposers.splice(0))dispose();
  vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();
});

// These literals are independent object-ID reference values retained by the
// real receiver probes, not values computed with production ObjectMapping.
const expectedIDs={near:1425233680,far:1022892529};
const phi=(1+Math.sqrt(5))/2;
function unit(x:number,y:number,z:number):Vec3{const length=Math.sqrt(x*x+y*y+z*z);return [x/length,y/length,z/length];}
// The first 3v face's corners are vertices0,3,9 respectively. References use
// the original normalized icosahedron corner vectors; no production topology
// or interpolation function is used to construct expected coordinates.
const corners={0:unit(-1,phi,0),3:unit(0,1,phi),9:unit(-phi,0,1)};
function scene(near=0,far=3):Scene{const value=emptyScene();value.pieces=[newPiece('note',near,'near'),newPiece('note',far,'far')];return value;}
function trigger(sequence:number):EngineEvent{return {type:'trigger',trigger:{session:'s2',sequence,id:`s2-${sequence}`,generatorId:'gen',nodeId:'near',emission:0,beat:0,onset:10,angle:0,position:corners[0],sound:{kind:'note',frequency:440,timbre:'sine',duration:1,level:.1}}};}

function environment(name:string){
  vi.useFakeTimers();let nowMs=1000;
  vi.spyOn(performance,'now').mockImplementation(()=>nowMs);
  vi.stubGlobal('window',{setInterval:(callback:()=>void,ms:number)=>setInterval(callback,ms)});
  const trace:Trace={name,scope:'Pure mocked WebSocket/timer; UTF-8 bufferedAmount model, not actual network evidence.',rows:[]};traces.push(trace);
  const sockets:Socket[]=[];
  class Socket{
    static OPEN=1;readyState=1;bufferedAmount=0;
    sent:{timeMs:number;packet:Packet;bytes:number;before:number;after:number}[]=[];
    closes:{timeMs:number;code?:number;reason?:string}[]=[];
    onopen:(()=>void)|null=null;onmessage:((event:{data:string})=>void)|null=null;
    onclose:(()=>void)|null=null;onerror:(()=>void)|null=null;
    constructor(){sockets.push(this);}
    send(data:string){
      if(this.readyState!==1)throw Error('Mock attempted send on closed socket');
      const before=this.bufferedAmount,bytes=Buffer.byteLength(data,'utf8');this.bufferedAmount+=bytes;
      const row={timeMs:nowMs,packet:JSON.parse(data) as Packet,bytes,before,after:this.bufferedAmount};this.sent.push(row);trace.rows.push({type:'send',...row});
    }
    close(code?:number,reason?:string){
      const row={timeMs:nowMs,code,reason};this.closes.push(row);trace.rows.push({type:'close',...row});this.readyState=3;this.onclose?.();
    }
  }
  vi.stubGlobal('WebSocket',Socket);
  const adapter=new OutputAdapter(()=>0),statuses:{timeMs:number;text:string}[]=[];
  adapter.onStatus=text=>{const row={timeMs:nowMs,text};statuses.push(row);trace.rows.push({type:'status',...row});};
  adapter.setScene(scene(),'load');adapter.connect();const socket=sockets[0];socket.onopen!();
  for(let i=0;i<8;i++){
    const probe=socket.sent.at(-1)!.packet;expect(probe.type).toBe('sync');
    socket.onmessage!({data:JSON.stringify({type:'sync',t0:probe.t0,server:probe.t0})});
  }
  expect(socket.sent.filter(row=>row.packet.type==='position')).toHaveLength(2);
  const initial=socket.sent.filter(row=>row.packet.type==='position');
  for(const [id,vertex]of [['near',0],['far',3]] as const){
    const row=initial.find(row=>row.packet.nodeId===id)!;expect(row.packet.objectId).toBe(expectedIDs[id]);
    (row.packet.position as number[]).forEach((coordinate,i)=>expect(coordinate).toBeCloseTo(corners[vertex][i],12));
  }
  socket.sent.length=0;socket.bufferedAmount=0;
  disposers.push(()=>adapter.dispose());
  return {adapter,socket,statuses,trace,
    advance(ms:number){for(let i=0;i<ms;i++){nowMs++;vi.advanceTimersByTime(1);}},
    buffer(bytes:number){socket.bufferedAmount=bytes;trace.rows.push({type:'modeled-buffer-change',timeMs:nowMs,bytes});},
    get nowMs(){return nowMs;}};
}

describe('movement congestion and independent reliable controls',()=>{
  it('pauses when the first movement send crosses64KiB inside a multiobject tick',()=>{
    const e=environment('in-loop-crossing');e.adapter.setScene(scene(3,0),'edit');e.buffer(LIMIT-1);e.advance(20);
    const positions=e.socket.sent.filter(row=>row.packet.type==='position');
    expect(positions).toHaveLength(1);expect(positions[0].before).toBe(LIMIT-1);expect(positions[0].after).toBeGreaterThan(LIMIT);
    expect(e.socket.closes).toHaveLength(0);expect(e.adapter.diagnostics.connected).toBe(true);
    e.advance(200);expect(e.socket.sent.filter(row=>row.packet.type==='position')).toHaveLength(1);expect(e.socket.closes).toHaveLength(0);
  });

  it('drains before500ms and sends the full newest snapshot including an unchanged object',()=>{
    const e=environment('drain-full-snapshot');e.buffer(LIMIT+1);e.advance(20);
    e.adapter.setScene(scene(3,0),'edit');e.adapter.setScene(scene(9,3),'edit');e.advance(200);
    expect(e.socket.sent).toHaveLength(0);expect(e.socket.closes).toHaveLength(0);
    e.buffer(0);e.advance(20);
    const positions=e.socket.sent.filter(row=>row.packet.type==='position');expect(positions).toHaveLength(2);
    expect(positions.map(row=>row.packet.nodeId).sort()).toEqual(['far','near']);
    for(const [id,vertex]of [['near',9],['far',3]] as const){
      const row=positions.find(row=>row.packet.nodeId===id)!;expect(row.packet.objectId).toBe(expectedIDs[id]);
      (row.packet.position as number[]).forEach((coordinate,i)=>expect(coordinate).toBeCloseTo(corners[vertex][i],12));
    }
    expect(new Set(positions.map(row=>row.packet.sequence)).size).toBe(2);expect(e.socket.closes).toHaveLength(0);
  });

  it('reports one disconnect only after500ms of persistent movement-only congestion',()=>{
    const e=environment('persistent-movement-watchdog');e.buffer(LIMIT+1);e.advance(20);const firstObserved=e.nowMs;
    e.advance(499);expect(e.socket.closes).toHaveLength(0);expect(e.socket.sent).toHaveLength(0);
    e.advance(41);expect(e.socket.closes).toHaveLength(1);
    const elapsed=e.socket.closes[0].timeMs-firstObserved;expect(elapsed).toBeGreaterThanOrEqual(500);expect(elapsed).toBeLessThanOrEqual(540);
    expect(e.statuses.filter(row=>row.text.includes('backpressure'))).toHaveLength(1);expect(e.adapter.diagnostics.connected).toBe(false);
    e.advance(1000);expect(e.socket.closes).toHaveLength(1);expect(e.socket.sent).toHaveLength(0);
  });

  it.each(['trigger','cancel'] as const)('fails closed immediately for reliable%s above64KiB without deferred replay',kind=>{
    const e=environment(`reliable-${kind}`);e.adapter.event(trigger(1));e.socket.sent.length=0;e.buffer(LIMIT+1);
    if(kind==='trigger')e.adapter.event(trigger(2));else e.adapter.event({type:'cancel',ids:['s2-1'],nodeIds:[],reason:'edit'});
    expect(e.socket.closes).toHaveLength(1);expect(e.socket.closes[0].timeMs).toBe(e.nowMs);
    expect(e.statuses.at(-1)?.text).toContain('backpressure');expect(e.socket.sent).toHaveLength(0);
    e.buffer(0);e.advance(600);expect(e.socket.sent).toHaveLength(0);expect(e.socket.closes).toHaveLength(1);
  });
});
