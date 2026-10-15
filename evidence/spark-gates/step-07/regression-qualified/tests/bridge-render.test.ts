import { expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createBridge } from '../src/output/bridge';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate: () => boolean, timeout = 3000) {
  const end = performance.now() + timeout;
  while (!predicate()) {
    if (performance.now() > end) throw Error('Receiver observation timed out');
    await wait(5);
  }
}

it('integrated render receiver preserves execution coordinates, cancellation and stable object binding', async () => {
  const bridge = createBridge(0, 0, { renderClock: true });
  let socket: WebSocket | undefined, heartbeat: ReturnType<typeof setInterval> | undefined;
  try {
    const port = await bridge.start();
    expect(bridge.state().clock).toMatchObject({ ready: true });
    socket = new WebSocket(`ws://127.0.0.1:${port}`, { origin: 'http://127.0.0.1:5417' });
    await new Promise<void>((resolve, reject) => { socket!.once('open', resolve); socket!.once('error', reject); });
    const send = (packet: Record<string, unknown>) => socket!.send(JSON.stringify({ version: 1, ...packet }));
    send({ type: 'start', session: 'integration', sequence: 0 });
    heartbeat = setInterval(() => send({ type: 'heartbeat', session: 'integration' }), 50);
    send({ type: 'position', session: 'integration', sequence: 1, nodeId: 'note', objectId: 7, position: [1, 0, 0], sent: performance.now() / 1000 });
    await until(() => bridge.state().objects.length === 1);
    const onset = performance.now() / 1000 + 0.3;
    const trigger = { type: 'trigger', session: 'integration', sequence: 1, triggerSequence: 1, id: 'integration-1', generatorId: 'gen', nodeId: 'note', objectId: 7, onset, sound: { kind: 'note', frequency: 440, timbre: 'sine', duration: 2, level: 0.5 } };
    send(trigger);
    await until(() => bridge.state().pending === 1);
    send({ type: 'position', session: 'integration', sequence: 2, nodeId: 'note', objectId: 8, position: [0, 1, 0], sent: performance.now() / 1000 });
    await until(() => bridge.records.some(row => row.type === 'rejected'));
    expect(bridge.records.find(row => row.type === 'rejected')?.reason).toContain('Active node cannot change its object ID');
    expect(bridge.state().objects).toMatchObject([{ objectId: 7, position: [1, 0, 0] }]);
    await until(() => bridge.records.some(row => row.type === 'onset' && row.id === trigger.id));
    const receipt = bridge.records.find(row => row.type === 'onset' && row.id === trigger.id)!;
    expect(receipt).toMatchObject({ objectId: 7, nodeId: 'note', generatorId: 'gen', position: [1, 0, 0] });
    expect(Math.abs(Number(receipt.errorMs)) + Number(receipt.uncertaintyMs)).toBeLessThanOrEqual(20);
    expect(receipt.currentFrame).toBeGreaterThan(0);
    expect(bridge.state().activeVoices).toBe(1);
    send({ type: 'cancel', session: 'integration', sequence: 2, ids: [trigger.id], nodeIds: ['note'] });
    await until(() => bridge.state().objects.length === 0 && bridge.state().activeVoices === 0);
    send({ type: 'position', session: 'integration', sequence: 3, nodeId: 'note', objectId: 8, position: [0, 1, 0], sent: performance.now() / 1000 });
    send({ ...trigger, sequence: 3, triggerSequence: 2, id: 'integration-2', objectId: 8, onset: performance.now() / 1000 + 0.3 });
    await until(() => bridge.state().pending === 1);
    send({ type: 'cancel', session: 'integration', sequence: 4, ids: ['integration-2'], nodeIds: [] });
    await wait(400);
    expect(bridge.records.filter(row => row.type === 'onset')).toHaveLength(1);
    expect(bridge.state().pending).toBe(0);
    expect(bridge.state().clock).toMatchObject({ ready: true });
    expect(bridge.records.filter(row => row.type === 'clock-error')).toHaveLength(0);
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    socket?.close();
    await bridge.close();
  }
}, 20000);
