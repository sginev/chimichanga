export type TickerUpdateCallback = (deltaSeconds: number) => unknown;

export function createSimpleTicker() {
  const funcs = new Set<TickerUpdateCallback>();
  
  let lastCallTime = 0;

  function tick() {
    const timeNow = performance.now();
    const deltaSeconds = (timeNow - lastCallTime) * .001;
    lastCallTime = timeNow;

    for (const func of funcs) {
      try {
        func(deltaSeconds);
      } catch (e) {
        console.error(func, e);
      }
    }

    requestAnimationFrame(tick);
  }

  tick();

  return {
    add(func: TickerUpdateCallback) {
      funcs.add(func);
      return () => this.remove(func);
    },
    remove(func: TickerUpdateCallback) {
      return funcs.delete(func);
    }
  }
}

export type SimpleTicker = ReturnType<typeof createSimpleTicker>;

export module SimpleTicker {
  export const $default = createSimpleTicker();
}