export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function values<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj);
}

export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function hasOwnProperty<T extends object, K extends keyof T>(obj: T, key: K): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (hasOwnProperty(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj } as Omit<T, K>;
  for (const key of keys) {
    delete (result as any)[key];
  }
  return result;
}

export function merge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  let result = { ...target } as T;
  for (const source of sources) {
    result = { ...result, ...source } as T;
  }
  return result;
}

export function clone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(clone) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (hasOwnProperty(obj, key)) {
      cloned[key] = clone(obj[key]);
    }
  }
  return cloned;
}

export function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!hasOwnProperty(b, key) || !isEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  
  return false;
}

export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  
  if (Array.isArray(obj) || typeof obj === 'string') {
    return obj.length === 0;
  }
  
  if (typeof obj === 'object') {
    return Object.keys(obj).length === 0;
  }
  
  return false;
}

export function get(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.');
  let result: any = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

export function set(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const result = clone(obj);
  let current: any = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }
  return result;
}

export function unset(obj: any, path: string): any {
  const keys = path.split('.');
  const result = clone(obj);
  let current: any = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      return result;
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    delete current[lastKey];
  }
  return result;
} 