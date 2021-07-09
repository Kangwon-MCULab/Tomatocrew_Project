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
const util_1 = require("./util");
class FiredEvent extends util_1.Deferred {
    constructor(value, reverse) {
        super();
        this.value = value;
        this.reverse = reverse;
    }
}
var Event;
(function (Event) {
    function make(name, reverse) {
        var list = [];
        var firing = false;
        const fireQueue = [];
        const event = function event(onfunc) {
            list.push(onfunc);
        };
        function processFire() {
            return __awaiter(this, void 0, void 0, function* () {
                firing = true;
                yield Promise.resolve();
                for (;;) {
                    const fired = fireQueue.shift();
                    if (!fired)
                        break;
                    list = list.filter(v => v);
                    try {
                        if (reverse) {
                            for (var i = list.length - 1; i >= 0; i--) {
                                const func = list[i];
                                if (!func)
                                    continue;
                                const prom = func(fired.value);
                                if (prom)
                                    yield prom;
                            }
                        }
                        else {
                            for (const func of list) {
                                if (!func)
                                    continue;
                                const prom = func(fired.value);
                                if (prom)
                                    yield prom;
                            }
                        }
                        fired.resolve();
                    }
                    catch (err) {
                        fired.reject(err);
                    }
                }
                firing = false;
            });
        }
        event.fire = (value) => {
            const fired = new FiredEvent(value, false);
            fireQueue.push(fired);
            if (!firing)
                processFire();
            return fired;
        };
        event.remove = (onfunc) => {
            const idx = list.indexOf(onfunc);
            if (idx !== -1) {
                list[idx] = undefined;
                return true;
            }
            return false;
        };
        event.clear = () => {
            list.length = 0;
        };
        return event;
    }
    Event.make = make;
})(Event = exports.Event || (exports.Event = {}));
//# sourceMappingURL=event.js.map