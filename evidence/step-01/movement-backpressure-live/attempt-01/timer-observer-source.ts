/** Pure observation wrapper; serializable into the browser init script. */
export function wrapObservedInterval(handler: (...args: any[]) => any, a: any, id: number,
  clock: () => number, record: (rows: any[], row: any, cap: number) => void) {
  return function(this: unknown, ...args: any[]) {
    const previous = a.executing;
    const run: any = {id, index: a.intervalRuns.length, entry: clock(),
      bufferedBefore: a.socket?.bufferedAmount ?? null, sendStart: a.sends.length};
    a.executing = run;
    try { return Reflect.apply(handler, this, args); }
    finally {
      run.exit = clock();
      run.bufferedAfter = a.socket?.bufferedAmount ?? null;
      run.sendEnd = a.sends.length;
      a.executing = previous;
      record(a.intervalRuns, run, 4096);
      if (a.pressureStart !== null && run.entry >= a.pressureStart && run.bufferedBefore > 65536 &&
          a.producerCandidates.size === 1 && a.producerCandidates.has(id)) a.firstHighRun ??= run;
    }
  };
}
