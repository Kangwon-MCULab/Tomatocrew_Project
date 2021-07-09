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
const vsutil_1 = require("../vsutil/vsutil");
const config_1 = require("../config");
const ws_1 = require("../vsutil/ws");
const work_1 = require("../vsutil/work");
exports.commands = {
    'ftpkr.init'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            args.workspace = yield vsutil_1.vsutil.createWorkspace();
            if (!args.workspace)
                return;
            const config = args.workspace.query(config_1.Config);
            config.init();
        });
    },
    'ftpkr.cancel'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const workspace of ws_1.Workspace.all()) {
                workspace.query(work_1.Scheduler).cancel();
            }
        });
    },
};
//# sourceMappingURL=config.js.map