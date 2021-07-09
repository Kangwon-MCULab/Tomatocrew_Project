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
const krfile_1 = require("krfile");
const sm_1 = require("../util/sm");
function mergeType(obj, other) {
    if (obj.properties) {
        if (other.properties) {
            for (const p in other.properties) {
                const ori = obj.properties[p];
                if (ori)
                    mergeType(ori, other.properties[p]);
                else
                    obj.properties[p] = other.properties[p];
            }
        }
    }
}
function readType(file, obj) {
    return __awaiter(this, void 0, void 0, function* () {
        if (obj.$ref) {
            return yield readSchema(file.sibling(obj.$ref));
        }
        if (obj.allOf) {
            for (var i = 0; i < obj.allOf.length; i++) {
                const c = obj.allOf[i] = yield readType(file, obj.allOf[i]);
                mergeType(obj, c);
            }
        }
        return obj;
    });
}
function readSchema(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const obj = yield file.json();
        yield readType(file, obj);
        return obj;
    });
}
class MdWriter {
    constructor() {
        this.md = '';
        this.objects = {};
        this.address = '';
        this.itemName = '';
    }
    finalize() {
        var md = '';
        for (const name in this.objects) {
            md += '## ' + (name || 'ftp-kr.json') + '\n';
            md += this.objects[name];
        }
        return md;
    }
    object(obj) {
        const olditemname = this.itemName;
        const oldaddress = this.address;
        const oldmd = this.md;
        const prefix = oldaddress ? oldaddress + '.' : '';
        for (var p in obj.properties) {
            this.itemName = p;
            this.address = prefix + p;
            this.type(obj.properties[p]);
        }
        this.itemName = olditemname;
        this.address = oldaddress;
        this.objects[this.address] = this.md;
        this.md = oldmd;
    }
    type(obj) {
        this.md += `* **${this.address}** `;
        const enumlist = obj.enum;
        if (enumlist && enumlist.length <= 5) {
            this.md += `(enum: ${enumlist.join(', ')})`;
        }
        else if (obj.items) {
            this.md += `(${obj.items.type}[])`;
        }
        else if (obj.type)
            this.md += `(${obj.type})`;
        if (obj.deprecationMessage) {
            this.md += ' (**DEPRECATED: ' + obj.deprecationMessage + '**)';
        }
        var desc = obj.description || '';
        if (obj.properties) {
            this.object(obj);
            desc += ` [see properties](${this.address.replace(/\./g, '')})`;
        }
        if (desc)
            this.md += ' - ' + desc;
        this.md += '\n';
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const arg = process.argv[2];
        if (!arg)
            return;
        const file = new krfile_1.File(arg);
        const obj = yield readSchema(file);
        const writer = new MdWriter;
        writer.object(obj);
        yield file.reext('md').create(writer.finalize());
    });
}
main().catch(err => sm_1.printMappedError(err));
//# sourceMappingURL=schema_to_md.js.map