"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunk = chunk;
exports.unique = unique;
exports.uniqueBy = uniqueBy;
exports.groupBy = groupBy;
exports.sortBy = sortBy;
exports.filterBy = filterBy;
exports.find = find;
exports.findIndex = findIndex;
exports.includes = includes;
exports.remove = remove;
exports.removeAt = removeAt;
exports.insert = insert;
exports.replace = replace;
exports.shuffle = shuffle;
exports.sample = sample;
exports.flatten = flatten;
exports.compact = compact;
exports.intersection = intersection;
exports.union = union;
exports.difference = difference;
exports.symmetricDifference = symmetricDifference;
exports.countBy = countBy;
exports.sumBy = sumBy;
exports.averageBy = averageBy;
exports.minBy = minBy;
exports.maxBy = maxBy;
exports.partition = partition;
exports.zip = zip;
exports.unzip = unzip;
function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
function unique(array) {
    return [...new Set(array)];
}
function uniqueBy(array, key) {
    const seen = new Set();
    return array.filter(item => {
        const k = key(item);
        if (seen.has(k)) {
            return false;
        }
        seen.add(k);
        return true;
    });
}
function groupBy(array, key) {
    const groups = new Map();
    for (const item of array) {
        const k = key(item);
        if (!groups.has(k)) {
            groups.set(k, []);
        }
        groups.get(k).push(item);
    }
    return groups;
}
function sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = key(a);
        const bVal = key(b);
        if (aVal < bVal)
            return direction === 'asc' ? -1 : 1;
        if (aVal > bVal)
            return direction === 'asc' ? 1 : -1;
        return 0;
    });
}
function filterBy(array, predicate) {
    return array.filter(predicate);
}
function find(array, predicate) {
    return array.find(predicate);
}
function findIndex(array, predicate) {
    return array.findIndex(predicate);
}
function includes(array, item) {
    return array.includes(item);
}
function remove(array, item) {
    return array.filter(i => i !== item);
}
function removeAt(array, index) {
    return array.filter((_, i) => i !== index);
}
function insert(array, index, item) {
    const result = [...array];
    result.splice(index, 0, item);
    return result;
}
function replace(array, index, item) {
    const result = [...array];
    result[index] = item;
    return result;
}
function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = result[i];
        result[i] = result[j];
        result[j] = temp;
    }
    return result;
}
function sample(array, size = 1) {
    if (size >= array.length) {
        return shuffle(array);
    }
    const shuffled = shuffle(array);
    return shuffled.slice(0, size);
}
function flatten(array) {
    return array.reduce((flat, item) => {
        return flat.concat(Array.isArray(item) ? flatten(item) : item);
    }, []);
}
function compact(array) {
    return array.filter((item) => item != null);
}
function intersection(array1, array2) {
    const set2 = new Set(array2);
    return array1.filter(item => set2.has(item));
}
function union(array1, array2) {
    return unique([...array1, ...array2]);
}
function difference(array1, array2) {
    const set2 = new Set(array2);
    return array1.filter(item => !set2.has(item));
}
function symmetricDifference(array1, array2) {
    const diff1 = difference(array1, array2);
    const diff2 = difference(array2, array1);
    return [...diff1, ...diff2];
}
function countBy(array, key) {
    const counts = new Map();
    for (const item of array) {
        const k = key(item);
        counts.set(k, (counts.get(k) || 0) + 1);
    }
    return counts;
}
function sumBy(array, key) {
    return array.reduce((sum, item) => sum + key(item), 0);
}
function averageBy(array, key) {
    if (array.length === 0)
        return 0;
    return sumBy(array, key) / array.length;
}
function minBy(array, key) {
    if (array.length === 0)
        return undefined;
    return array.reduce((min, item) => {
        return key(item) < key(min) ? item : min;
    });
}
function maxBy(array, key) {
    if (array.length === 0)
        return undefined;
    return array.reduce((max, item) => {
        return key(item) > key(max) ? item : max;
    });
}
function partition(array, predicate) {
    const truthy = [];
    const falsy = [];
    for (const item of array) {
        if (predicate(item)) {
            truthy.push(item);
        }
        else {
            falsy.push(item);
        }
    }
    return [truthy, falsy];
}
function zip(array1, array2) {
    const length = Math.min(array1.length, array2.length);
    const result = [];
    for (let i = 0; i < length; i++) {
        const item1 = array1[i];
        const item2 = array2[i];
        if (item1 !== undefined && item2 !== undefined) {
            result.push([item1, item2]);
        }
    }
    return result;
}
function unzip(array) {
    const array1 = [];
    const array2 = [];
    for (const [item1, item2] of array) {
        array1.push(item1);
        array2.push(item2);
    }
    return [array1, array2];
}
//# sourceMappingURL=array.js.map