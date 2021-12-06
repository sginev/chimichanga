type Callback = () => unknown;

export class StaggeredCaller {
  private readonly monkeys: Callback[] = new Array<Callback>();

  private handle: ReturnType<typeof requestAnimationFrame> = -1;

  private readonly addMonkey = (cb: Callback) => {
    this.monkeys.push(cb);
    if (this.handle === -1) {
      this.handle = requestAnimationFrame(this.onEnterFrame);
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
}

export function staggerCallback<T, R extends any[]>(cb: (...R) => T) {
  const sc = new StaggeredCaller();
  return (...args: R): Promise<T> => sc.enqueue(() => cb(...args as R));
}