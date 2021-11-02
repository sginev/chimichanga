export function range(count: number) {
  if (count <= 0) return [];
  return new Array(count).fill(0).map((_, i) => i) as number[];
}

export module range {
  export function onlyNulls(count: number) {
    if (count <= 0) return [];
    return new Array(count).fill(null);
  }

  export function fromTo<T extends number>(min: T, max: T) {
    if (max <= min) return [];
    return new Array(~~(max - min)).fill(null).map((_, i) => (~~min + i) as T);
  }

  export function fromToIncluding(min: number, max: number) {
    if (max < min) return [];
    return new Array(~~(max - min + 1)).fill(null).map((_, i) => ~~min + i);
  }
}
