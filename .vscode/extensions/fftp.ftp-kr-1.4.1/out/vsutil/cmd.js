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
const vscode_1 = require("vscode");
const krfile_1 = require("krfile");
const error_1 = require("./error");
const log_1 = require("./log");
const ws_1 = require("./ws");
const ftptreeitem_1 = require("./ftptreeitem");
function runCommand(commands, name, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        var cmdargs = {};
        try {
            try {
                const arg = args[0];
                if (arg instanceof ftptreeitem_1.FtpTreeItem) {
                    cmdargs.treeItem = arg;
                }
                else {
                    if (arg instanceof vscode_1.Uri) {
                        if (arg.scheme === 'file') {
                            cmdargs.file = new krfile_1.File(arg.fsPath);
                            const files = args[1];
                            if (files && (files instanceof Array) && (files[0] instanceof vscode_1.Uri)) {
                                cmdargs.files = files.map((uri) => new krfile_1.File(uri.fsPath));
                            }
                            else {
                                cmdargs.files = [cmdargs.file];
                            }
                        }
                        else {
                            cmdargs.uri = arg;
                        }
                    }
                    else {
                        const editor = vscode_1.window.activeTextEditor;
                        if (editor) {
                            const doc = editor.document;
                            cmdargs.file = new krfile_1.File(doc.uri.fsPath);
                            cmdargs.files = [cmdargs.file];
                            cmdargs.openedFile = true;
                            yield doc.save();
                        }
                    }
                    if (cmdargs.file) {
                        cmdargs.workspace = ws_1.Workspace.fromFile(cmdargs.file);
                    }
                }
            }
            catch (e) {
                if (!cmdargs.workspace)
                    cmdargs.workspace = ws_1.Workspace.one();
            }
            const logger = cmdargs.workspace ? cmdargs.workspace.query(log_1.Logger) : log_1.defaultLogger;
            logger.verbose(`[Command] ${name}`);
            yield commands[name](cmdargs);
        }
        catch (err) {
            const logger = cmdargs.workspace ? cmdargs.workspace.query(log_1.Logger) : log_1.defaultLogger;
            switch (err) {
                case 'PASSWORD_CANCEL':
                    logger.verbose(`[Command:${name}]: cancelled by password input`);
                    break;
                default:
                    error_1.processError(logger, err);
                    break;
            }
        }
    });
}
var Command;
(function (Command) {
    function register(context, ...cmdlist) {
        for (const cmds of cmdlist) {
            for (const name in cmds) {
                const disposable = vscode_1.commands.registerCommand(name, (...args) => runCommand(cmds, name, ...args));
                context.subscriptions.push(disposable);
            }
        }
    }
    Command.register = register;
})(Command = exports.Command || (exports.Command = {}));
//# sourceMappingURL=cmd.js.map