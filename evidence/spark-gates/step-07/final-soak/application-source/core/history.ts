import { type Scene,LIMITS,validateScene } from './contracts';
export class History {
 private undoStack:{scene:Scene;mode:'edit'|'load'|'clear'}[]=[];private redoStack:{scene:Scene;mode:'edit'|'load'|'clear'}[]=[];
 restorationMode:'edit'|'load'|'clear'='edit';
 push(scene:Scene,mode:'edit'|'load'|'clear'='edit'){this.undoStack.push({scene:structuredClone(scene),mode});if(this.undoStack.length>LIMITS.history)this.undoStack.shift();this.redoStack=[];}
 undo(current:Scene){const entry=this.undoStack.pop();if(!entry)return null;this.redoStack.push({scene:structuredClone(current),mode:entry.mode});this.restorationMode=entry.mode==='edit'?'edit':'load';return entry.scene;}
 redo(current:Scene){const entry=this.redoStack.pop();if(!entry)return null;this.undoStack.push({scene:structuredClone(current),mode:entry.mode});this.restorationMode=entry.mode;return entry.scene;}
 get canUndo(){return this.undoStack.length>0;}
 get canRedo(){return this.redoStack.length>0;}
}
export function exportScene(scene:Scene){return JSON.stringify(validateScene(scene),null,2);}
export function importScene(text:string){if(text.length>128*1024)throw Error('Scene file exceeds 128 KiB');return validateScene(JSON.parse(text));}
export function saveScene(scene:Scene,storage:Pick<Storage,'setItem'>){storage.setItem('bongo-planet-scene-v1',exportScene(scene));}
export function loadScene(storage:Pick<Storage,'getItem'>){const raw=storage.getItem('bongo-planet-scene-v1');if(!raw)throw Error('No local save yet');return importScene(raw);}
