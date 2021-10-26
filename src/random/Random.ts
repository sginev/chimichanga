module Random {
  export function fromTo(from: number, to: number, lean:number = 0): number {
    return from + Math.pow(Math.random(), 2 ** -lean) * (to - from);
  }
}
