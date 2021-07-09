"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Deferred {
    constructor() {
        this[Symbol.toStringTag] = "Promise";
        this.resolve = undefined;
        this.reject = undefined;
        this.promise = new Promise((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
    }
    then(onfulfilled, onreject) {
        return this.promise.then(onfulfilled, onreject);
    }
    catch(func) {
        return this.promise.catch(func);
    }
}
exports.Deferred = Deferred;
function isEmptyObject(obj) {
    for (var p in obj)
        return false;
    return true;
}
exports.isEmptyObject = isEmptyObject;
function addOptions(args, options) {
    for (const key in options) {
        const value = options[key];
        if (Array.isArray(value)) {
            for (const val of value) {
                args.push("--" + key);
                args.push(val);
            }
            continue;
        }
        if (typeof value === 'boolean' && value === false) {
            continue;
        }
        args.push("--" + key);
        if (value !== true) {
            args.push(value);
        }
    }
}
exports.addOptions = addOptions;
function merge(original, overrider, access) {
    if (!overrider)
        return original;
    const conststr = [];
    const arrlist = [];
    var nex;
    if (!access) {
        nex = original;
    }
    else {
        nex = access;
        for (var p in original)
            access[p] = original[p];
    }
    function convert(value) {
        if (typeof value !== "string")
            return value;
        var nvalue = "";
        var i = 0;
        for (;;) {
            var j = value.indexOf("%", i);
            if (j === -1)
                break;
            var tx = value.substring(i, j);
            j++;
            var k = value.indexOf("%", j);
            if (k === -1)
                break;
            nvalue += tx;
            var varname = value.substring(j, k);
            if (varname in nex) {
                var val = nex[varname];
                if (val instanceof Array) {
                    if (val.length === 1) {
                        nvalue += val[0];
                    }
                    else {
                        conststr.push(nvalue);
                        nvalue = '';
                        arrlist.push(val);
                    }
                }
                else
                    nvalue += val;
            }
            else
                nvalue += "%" + varname + "%";
            i = k + 1;
        }
        nvalue += value.substr(i);
        if (arrlist.length !== 0) {
            conststr.push(nvalue);
            var from = [conststr];
            var to = [];
            for (var j = 0; j < arrlist.length; j++) {
                const list = arrlist[j];
                for (var i = 0; i < list.length; i++) {
                    for (var k = 0; k < from.length; k++) {
                        const cs = from[k];
                        const ncs = cs.slice(1, cs.length);
                        ncs[0] = cs[0] + list[i] + cs[1];
                        to.push(ncs);
                    }
                }
                var t = to;
                to = from;
                from = t;
                to.length = 0;
            }
            return from.map(v => v[0]);
        }
        return nvalue;
    }
    var out = {};
    for (var p in overrider) {
        var value = overrider[p];
        if (value instanceof Array) {
            const nvalue = [];
            for (let val of value) {
                val = convert(val);
                if (val instanceof Array)
                    nvalue.push(nvalue, ...val);
                else
                    nvalue.push(val);
            }
            out[p] = nvalue;
        }
        else if (value instanceof Object) {
            const ori = original[p];
            if (ori instanceof Object) {
                out[p] = merge(ori, value, nex[p]);
            }
            else {
                out[p] = value;
            }
        }
        else {
            out[p] = convert(value);
        }
    }
    for (const p in original) {
        if (p in out)
            continue;
        out[p] = original[p];
    }
    return out;
}
exports.merge = merge;
function getFilePosition(content, index) {
    const front = content.substring(0, index);
    var line = 1;
    var lastidx = 0;
    for (;;) {
        const idx = front.indexOf('\n', lastidx);
        if (idx === -1)
            break;
        line++;
        lastidx = idx + 1;
    }
    return {
        line,
        column: index - lastidx
    };
}
exports.getFilePosition = getFilePosition;
function clone(value) {
    if (!(value instanceof Object))
        return value;
    if (value instanceof Array) {
        const arr = new Array(value.length);
        for (var i = 0; i < arr.length; i++) {
            arr[i] = clone(value[i]);
        }
        return arr;
    }
    if (value instanceof Map) {
        const map = new Map(value.entries());
        return map;
    }
    if (value instanceof Set) {
        const set = new Set(value.values());
        return set;
    }
    if (value instanceof RegExp) {
        return value;
    }
    const nobj = new Object;
    nobj.__proto__ = value.__proto__;
    for (const p in value) {
        nobj[p] = value[p];
    }
    return nobj;
}
exports.clone = clone;
function promiseErrorWrap(prom) {
    const stack = Error().stack || '';
    return prom.catch(err => {
        if (err && err.stack) {
            if (!err.__messageCodeAttached && err.code) {
                err.message = err.message + "[" + err.code + "]";
                err.__messageCodeAttached = true;
            }
            err.stack = err.stack + stack.substr(stack.indexOf('\n'));
        }
        throw err;
    });
}
exports.promiseErrorWrap = promiseErrorWrap;
function replaceErrorUrl(stack, foreach) {
    const regexp = /^\tat ([^(\n]+) \(([^)\n]+)\:([0-9]+)\:([0-9]+)\)$/gm;
    var arr;
    var lastIndex = 0;
    var out = '';
    while (arr = regexp.exec(stack)) {
        out += stack.substring(lastIndex, arr.index);
        out += '\tat ';
        out += arr[1];
        out += ' (';
        out += foreach(arr[2], +arr[3], +arr[4]);
        out += ')';
        lastIndex = regexp.lastIndex;
    }
    out += stack.substr(lastIndex);
    return out;
}
exports.replaceErrorUrl = replaceErrorUrl;
function replaceErrorUrlAsync(stack, foreach) {
    return __awaiter(this, void 0, void 0, function* () {
        const regexp = /^\tat ([^(\n]+) \(([^)\n]+)\:([0-9]+)\:([0-9]+)\)$/gm;
        var arr;
        var lastIndex = 0;
        var out = '';
        while (arr = regexp.exec(stack)) {
            out += stack.substring(lastIndex, arr.index);
            out += '\tat ';
            out += arr[1];
            out += ' (';
            out += yield foreach(arr[2], +arr[3], +arr[4]);
            out += ')';
            lastIndex = regexp.lastIndex;
        }
        out += stack.substr(lastIndex);
        return out;
    });
}
exports.replaceErrorUrlAsync = replaceErrorUrlAsync;
//# sourceMappingURL=util.js.map