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
const source_map_1 = require("source-map");
const krfile_1 = require("krfile");
const util_1 = require("./util");
const rawSourceMap = {
    version: 3,
    file: 'min.js',
    names: ['bar', 'baz', 'n'],
    sources: ['one.js', 'two.js'],
    sourceRoot: 'http://example.com/www/js/',
    mappings: 'CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA'
};
function getTsPosition(js, line, column) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sm = yield js.reext('js.map').json();
            const res = yield source_map_1.SourceMapConsumer.with(sm, null, consumer => consumer.originalPositionFor({ line, column }));
            const source = res.source ? js.child(res.source).fsPath : js.fsPath;
            return { source, line: res.line || line, column: res.column || column };
        }
        catch (err) {
            return { source: js.fsPath, line, column };
        }
    });
}
exports.getTsPosition = getTsPosition;
function getMappedStack(err) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!err)
            return err;
        const stack = err.stack;
        if (typeof stack !== 'string')
            return err;
        return util_1.replaceErrorUrlAsync(stack, (path, line, column) => __awaiter(this, void 0, void 0, function* () {
            const pos = yield getTsPosition(new krfile_1.File(path), line, column);
            var res = '';
            res += pos.source;
            res += ':';
            res += pos.line;
            res += ':';
            res += pos.column;
            return res;
        }));
    });
}
exports.getMappedStack = getMappedStack;
function printMappedError(err) {
    return __awaiter(this, void 0, void 0, function* () {
        console.error(yield getMappedStack(err));
    });
}
exports.printMappedError = printMappedError;
//# sourceMappingURL=sm.js.map