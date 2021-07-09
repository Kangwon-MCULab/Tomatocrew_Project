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
const glob_inner = require("glob");
function glob(pattern) {
    pattern = pattern.replace(/\\/g, "/");
    return new Promise((resolve, reject) => {
        glob_inner(pattern, (err, files) => {
            if (err)
                reject(err);
            else
                resolve(files);
        });
    });
}
function globAll(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = [];
        for (const file of files) {
            res.push(...yield glob(file));
        }
        return res;
    });
}
function default_1(pattern) {
    if (pattern instanceof Array)
        return globAll(pattern);
    return glob(pattern);
}
exports.default = default_1;
;
//# sourceMappingURL=pglob.js.map