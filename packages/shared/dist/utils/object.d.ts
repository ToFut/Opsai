export declare function keys<T extends object>(obj: T): (keyof T)[];
export declare function values<T extends object>(obj: T): T[keyof T][];
export declare function entries<T extends object>(obj: T): [keyof T, T[keyof T]][];
export declare function hasOwnProperty<T extends object, K extends keyof T>(obj: T, key: K): boolean;
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
export declare function merge<T extends object>(target: T, ...sources: Partial<T>[]): T;
export declare function clone<T>(obj: T): T;
export declare function isEqual(a: any, b: any): boolean;
export declare function isEmpty(obj: any): boolean;
export declare function get(obj: any, path: string, defaultValue?: any): any;
export declare function set(obj: any, path: string, value: any): any;
export declare function unset(obj: any, path: string): any;
//# sourceMappingURL=object.d.ts.map