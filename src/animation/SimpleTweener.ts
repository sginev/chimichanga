import { Ease } from './Ease';
import { createSimpleTicker } from './SimpleTicker';

const defaultTicker = createSimpleTicker();

export type SimpleTweenUpdateCallback = (deltaSeconds: number) => unknown;

export type SimpleTweenOptions = {
  duration: number;
  easeFunc?: (progress: number) => number;
};

const DefaultSimpleTweenOptions: Required<SimpleTweenOptions> = {
  duration: 1,
  easeFunc: Ease.Linear,
};

export function createSimpleTweener() {
  const updateOptions: Required<SimpleTweenOptions> = {
    ...DefaultSimpleTweenOptions,
  };
  let updateCallback: null | SimpleTweenUpdateCallback = null;
  let updateTimeFactor = 1;
  let progress: number = 0;
  let running = false;

  const advance = (dt: number) => {
    progress += dt * updateTimeFactor;

    if (progress >= 1) {
      progress = 1;
    }

    if (updateCallback) {
      updateCallback(updateOptions.easeFunc(progress));
    }

    if (progress >= 1) {
      updateCallback = null;
      monkeysResolve.forEach(resolve => resolve());
      monkeysResolve.length = 0;
      stop();
    }
  };

  const stop = () => {
    defaultTicker.remove(advance);
    running = false;
    
    monkeysFinally.forEach(fin => fin());
    monkeysFinally.length = 0;
  };

  const start = () => {
    defaultTicker.add(advance);
    running = true;
  };

  /**
   * [ resolve, reject ] []
   */
  const monkeysResolve: Function[] = [];
  const monkeysReject: Function[] = [];
  const monkeysFinally: Function[] = [];

  return {
    tween(cb: SimpleTweenUpdateCallback, options: number | Partial<SimpleTweenOptions>) {
      Object.assign(
        updateOptions,
        DefaultSimpleTweenOptions,
        typeof options === 'number' ? { duration: options } : options
      );

      if (running) {
        stop();
        monkeysReject.forEach(reject => reject());
        monkeysReject.length = 0;
      }

      updateCallback = cb;
      updateTimeFactor = 1 / updateOptions.duration;
      progress = 0;
      start();
      advance(0);
      return {
        then(cb: () => unknown) {
          monkeysResolve.push(cb);
        },
        catch(cb: () => unknown) {
          monkeysReject.push(cb);
        },
        finally(cb: () => unknown) {
          monkeysFinally.push(cb);
        },
      };
    },
    stop,
  };
}

export type SimpleTweener = ReturnType<typeof createSimpleTweener>;
