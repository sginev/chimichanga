type StaggerableCallback = () => unknown;

export class StaggeredCaller {
  private readonly monkeys: StaggerableCallback[] = new Array<StaggerableCallback>();

  private handle: ReturnType<typeof requestAnimationFrame> = -1;

  private readonly addMonkey = (cb: StaggerableCallback) => {
    this.monkeys.push(cb);
    if (this.handle === -1) {
      this.handle = requestAnimationFrame(this.onEnterFrame);
    }
  }

  private readonly removeMonkey = (cb: StaggerableCallback) => {
    const index = this.monkeys.indexOf(cb);
    if (index !== -1) {
      this.monkeys.splice(index, 1);
    }
    if (this.monkeys.length === 0) {
      cancelAnimationFrame(this.handle);
      this.handle = -1;
    }
  }

  private readonly onEnterFrame = () => {
    this.monkeys.shift()?.();
    if (this.monkeys.length > 0) {
      this.handle = requestAnimationFrame(this.onEnterFrame);
    } else {
      this.handle = -1;
    }
  }

  enqueue(): Promise<void>;
  enqueue<T = void>(cb?: () => T): Promise<T>;
  enqueue<T = void>(cb?: () => T)
  {
    if (cb != null) {
      return new Promise<T>(resolve => this.addMonkey(() => resolve(cb())));
    } else {
      return new Promise<void>(this.addMonkey);
    }
  }

  enqueueCancellable<T = void>(cb?: () => T)
  {
    this.addMonkey(cb);
    return () => this.removeMonkey(cb);
  }

  purge() {
    this.monkeys.length = 0;

    if (this.handle !== -1) {
      cancelAnimationFrame(this.handle);
      this.handle = -1;
    }
  }
}

export function staggerCallback<T, R extends any[]>(cb: (...R) => T) {
  const sc = new StaggeredCaller();
  return (...args: R): Promise<T> => sc.enqueue(() => cb(...args as R));
}
