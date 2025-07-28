export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function uniqueBy<T, K>(array: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter(item => {
    const k = key(item);
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
}

export function groupBy<T, K>(array: T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  
  for (const item of array) {
    const k = key(item);
    if (!groups.has(k)) {
      groups.set(k, []);
    }
    groups.get(k)!.push(item);
  }
  
  return groups;
}

export function sortBy<T>(array: T[], key: (item: T) => any, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = key(a);
    const bVal = key(b);
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function filterBy<T>(array: T[], predicate: (item: T) => boolean): T[] {
  return array.filter(predicate);
}

export function find<T>(array: T[], predicate: (item: T) => boolean): T | undefined {
  return array.find(predicate);
}

export function findIndex<T>(array: T[], predicate: (item: T) => boolean): number {
  return array.findIndex(predicate);
}

export function includes<T>(array: T[], item: T): boolean {
  return array.includes(item);
}

export function remove<T>(array: T[], item: T): T[] {
  return array.filter(i => i !== item);
}

export function removeAt<T>(array: T[], index: number): T[] {
  return array.filter((_, i) => i !== index);
}

export function insert<T>(array: T[], index: number, item: T): T[] {
  const result = [...array];
  result.splice(index, 0, item);
  return result;
}

export function replace<T>(array: T[], index: number, item: T): T[] {
  const result = [...array];
  result[index] = item;
  return result;
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

export function sample<T>(array: T[], size: number = 1): T[] {
  if (size >= array.length) {
    return shuffle(array);
  }
  
  const shuffled = shuffle(array);
  return shuffled.slice(0, size);
}

export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
}

export function compact<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((item): item is T => item != null);
}

export function intersection<T>(array1: T[], array2: T[]): T[] {
  const set2 = new Set(array2);
  return array1.filter(item => set2.has(item));
}

export function union<T>(array1: T[], array2: T[]): T[] {
  return unique([...array1, ...array2]);
}

export function difference<T>(array1: T[], array2: T[]): T[] {
  const set2 = new Set(array2);
  return array1.filter(item => !set2.has(item));
}

export function symmetricDifference<T>(array1: T[], array2: T[]): T[] {
  const diff1 = difference(array1, array2);
  const diff2 = difference(array2, array1);
  return [...diff1, ...diff2];
}

export function countBy<T, K>(array: T[], key: (item: T) => K): Map<K, number> {
  const counts = new Map<K, number>();
  
  for (const item of array) {
    const k = key(item);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  
  return counts;
}

export function sumBy<T>(array: T[], key: (item: T) => number): number {
  return array.reduce((sum, item) => sum + key(item), 0);
}

export function averageBy<T>(array: T[], key: (item: T) => number): number {
  if (array.length === 0) return 0;
  return sumBy(array, key) / array.length;
}

export function minBy<T>(array: T[], key: (item: T) => number): T | undefined {
  if (array.length === 0) return undefined;
  
  return array.reduce((min, item) => {
    return key(item) < key(min) ? item : min;
  });
}

export function maxBy<T>(array: T[], key: (item: T) => number): T | undefined {
  if (array.length === 0) return undefined;
  
  return array.reduce((max, item) => {
    return key(item) > key(max) ? item : max;
  });
}

export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  
  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }
  
  return [truthy, falsy];
}

export function zip<T, U>(array1: T[], array2: U[]): [T, U][] {
  const length = Math.min(array1.length, array2.length);
  const result: [T, U][] = [];
  
  for (let i = 0; i < length; i++) {
    const item1 = array1[i];
    const item2 = array2[i];
    if (item1 !== undefined && item2 !== undefined) {
      result.push([item1, item2]);
    }
  }
  
  return result;
}

export function unzip<T, U>(array: [T, U][]): [T[], U[]] {
  const array1: T[] = [];
  const array2: U[] = [];
  
  for (const [item1, item2] of array) {
    array1.push(item1);
    array2.push(item2);
  }
  
  return [array1, array2];
} 