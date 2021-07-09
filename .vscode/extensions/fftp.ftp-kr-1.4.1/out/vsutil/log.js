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
const ws_1 = require("./ws");
const vsutil_1 = require("./vsutil");
const sm_1 = require("../util/sm");
const os = require("os");
const krfile_1 = require("krfile");
const util_1 = require("../util/util");
const krjson_1 = require("krjson");
var LogLevelEnum;
(function (LogLevelEnum) {
    LogLevelEnum[LogLevelEnum["VERBOSE"] = 0] = "VERBOSE";
    LogLevelEnum[LogLevelEnum["NORMAL"] = 1] = "NORMAL";
    LogLevelEnum[LogLevelEnum["ERROR"] = 2] = "ERROR";
})(LogLevelEnum || (LogLevelEnum = {}));
class Logger {
    constructor(name) {
        this.logLevel = LogLevelEnum.NORMAL;
        this.output = null;
        this.workspace = null;
        this.task = Promise.resolve();
        if (name instanceof ws_1.Workspace) {
            this.workspace = name;
            name = "ftp-kr/" + name.name;
        }
        this.output = vscode_1.window.createOutputChannel(name);
        Logger.all.add(this);
    }
    logRaw(level, ...message) {
        if (level < this.logLevel)
            return;
        if (!this.output)
            return;
        switch (this.logLevel) {
            case LogLevelEnum.VERBOSE:
                this.output.appendLine(LogLevelEnum[level] + ': ' + message.join(' ').replace(/\n/g, '\nVERBOSE: '));
                break;
            default:
                this.output.appendLine(message.join(' '));
                break;
        }
    }
    log(level, ...message) {
        return this.task = this.task.then(() => this.logRaw(level, ...message));
    }
    setLogLevel(level) {
        const oldlevel = this.logLevel;
        this.logLevel = LogLevelEnum[level];
        this.verbose(`logLevel = ${level}`);
        if (oldlevel === exports.defaultLogger.logLevel) {
            var minLevel = LogLevelEnum.ERROR;
            for (const logger of Logger.all) {
                if (logger.logLevel < minLevel) {
                    minLevel = logger.logLevel;
                }
            }
            exports.defaultLogger.logLevel = minLevel;
        }
    }
    message(...message) {
        this.log(LogLevelEnum.NORMAL, ...message);
    }
    verbose(...message) {
        this.log(LogLevelEnum.VERBOSE, ...message);
    }
    error(err) {
        return this.task = this.task.then(() => __awaiter(this, void 0, void 0, function* () {
            if (err === 'IGNORE')
                return;
            var stack = yield sm_1.getMappedStack(err);
            if (stack) {
                console.error(stack);
                this.logRaw(LogLevelEnum.ERROR, stack);
                const res = yield vscode_1.window.showErrorMessage(err.message, 'Detail');
                if (res !== 'Detail')
                    return;
                var output = '';
                if (err.task) {
                    output += `Task: ${err.task}\n`;
                }
                const pathRemap = [];
                pathRemap.push(new krfile_1.File(__dirname).parent().parent().fsPath, '[ftp-kr]');
                if (this.workspace) {
                    pathRemap.push(this.workspace.fsPath, `[workspace]`);
                }
                output += `platform: ${os.platform()}\n`;
                output += `arch: ${os.arch()}\n\n`;
                output += `[${err.constructor.name}]\nmessage: ${err.message}`;
                if (err.code) {
                    output += `\ncode: ${err.code}`;
                }
                if (err.errno) {
                    output += `\nerrno: ${err.errno}`;
                }
                function repath(path) {
                    for (var i = 0; i < pathRemap.length; i += 2) {
                        const prevPath = pathRemap[i];
                        if (path.startsWith(prevPath)) {
                            return pathRemap[i + 1] + path.substr(prevPath.length);
                        }
                    }
                    return path;
                }
                function filterAllField(value) {
                    if (typeof value === 'string') {
                        return repath(value);
                    }
                    if (typeof value === 'object') {
                        if (value instanceof Array) {
                            for (var i = 0; i < value.length; i++) {
                                value[i] = filterAllField(value[i]);
                            }
                        }
                        else {
                            for (const name in value) {
                                value[name] = filterAllField(value[name]);
                            }
                            if ("password" in value) {
                                const type = typeof value.password;
                                if (type === 'string')
                                    value.password = '********';
                                else
                                    value.password = '[' + type + ']';
                            }
                            if ("passphrase" in value) {
                                const type = typeof value.passphrase;
                                if (type === 'string')
                                    value.passphrase = '********';
                                else
                                    value.passphrase = '[' + type + ']';
                            }
                        }
                    }
                    return value;
                }
                stack = util_1.replaceErrorUrl(stack, (path, line, column) => `${repath(path)}:${line}:${column}`);
                output += `\n\n[Stack Trace]\n${stack}\n`;
                if (this.workspace) {
                    output += '\n[ftp-kr.json]\n';
                    const ftpkrjson = this.workspace.child('.vscode/ftp-kr.json');
                    try {
                        const readedjson = yield ftpkrjson.open();
                        try {
                            const obj = filterAllField(krjson_1.parseJson(readedjson));
                            output += JSON.stringify(obj, null, 4);
                        }
                        catch (err) {
                            output += 'Cannot Parse: ' + err + '\n';
                            output += readedjson;
                        }
                    }
                    catch (err) {
                        output += 'Cannot Read: ' + err + '\n';
                    }
                }
                vsutil_1.vsutil.openNew(output);
            }
            else {
                console.error(err);
                const errString = err.toString();
                this.logRaw(LogLevelEnum.ERROR, errString);
                vscode_1.window.showErrorMessage(errString);
            }
        }));
    }
    errorConfirm(err, ...items) {
        var msg;
        var error;
        if (err instanceof Error) {
            msg = err.message;
            error = err;
        }
        else {
            msg = err;
            error = Error(err);
        }
        this.task = this.task
            .then(() => sm_1.getMappedStack(error))
            .then(stack => this.logRaw(LogLevelEnum.ERROR, stack));
        return vscode_1.window.showErrorMessage(msg, ...items);
    }
    wrap(func) {
        try {
            func();
        }
        catch (err) {
            this.error(err);
        }
    }
    show() {
        if (!this.output)
            return;
        this.output.show();
    }
    clear() {
        const out = this.output;
        if (!out)
            return;
        out.clear();
    }
    dispose() {
        const out = this.output;
        if (!out)
            return;
        out.dispose();
        this.output = null;
        Logger.all.delete(this);
    }
}
Logger.all = new Set;
exports.Logger = Logger;
exports.defaultLogger = new Logger('ftp-kr');
//# sourceMappingURL=log.js.map