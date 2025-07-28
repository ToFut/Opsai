"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keys = keys;
exports.values = values;
exports.entries = entries;
exports.hasOwnProperty = hasOwnProperty;
exports.pick = pick;
exports.omit = omit;
exports.merge = merge;
exports.clone = clone;
exports.isEqual = isEqual;
exports.isEmpty = isEmpty;
exports.get = get;
exports.set = set;
exports.unset = unset;
function keys(obj) {
    return Object.keys(obj);
}
function values(obj) {
    return Object.values(obj);
}
function entries(obj) {
    return Object.entries(obj);
}
function hasOwnProperty(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
function pick(obj, keys) {
    const result = {};
    for (const key of keys) {
        if (hasOwnProperty(obj, key)) {
            result[key] = obj[key];
        }
    }
    return result;
}
function omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}
function merge(target, ...sources) {
    let result = { ...target };
    for (const source of sources) {
        result = { ...result, ...source };
    }
    return result;
}
function clone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(clone);
    }
    const cloned = {};
    for (const key in obj) {
        if (hasOwnProperty(obj, key)) {
            cloned[key] = clone(obj[key]);
        }
    }
    return cloned;
}
function isEqual(a, b) {
    if (a === b)
        return true;
    if (a == null || b == null)
        return false;
    if (typeof a !== typeof b)
        return false;
    if (Array.isArray(a) !== Array.isArray(b))
        return false;
    if (Array.isArray(a)) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (!isEqual(a[i], b[i]))
                return false;
        }
        return true;
    }
    if (typeof a === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length)
            return false;
        for (const key of keysA) {
            if (!hasOwnProperty(b, key) || !isEqual(a[key], b[key])) {
                return false;
            }
        }
        return true;
    }
    return false;
}
function isEmpty(obj) {
    if (obj == null)
        return true;
    if (Array.isArray(obj) || typeof obj === 'string') {
        return obj.length === 0;
    }
    if (typeof obj === 'object') {
        return Object.keys(obj).length === 0;
    }
    return false;
}
function get(obj, path, defaultValue) {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        if (result == null || typeof result !== 'object') {
            return defaultValue;
        }
        result = result[key];
    }
    return result !== undefined ? result : defaultValue;
}
function set(obj, path, value) {
    const keys = path.split('.');
    const result = clone(obj);
    let current = result;
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
function unset(obj, path) {
    const keys = path.split('.');
    const result = clone(obj);
    let current = result;
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
//# sourceMappingURL=object.js.map