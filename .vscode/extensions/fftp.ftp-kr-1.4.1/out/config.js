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
require("krjson");
const work_1 = require("./vsutil/work");
const vsutil_1 = require("./vsutil/vsutil");
const error_1 = require("./vsutil/error");
const log_1 = require("./vsutil/log");
const event_1 = require("./util/event");
const ftpkr_config_1 = require("./util/ftpkr_config");
var initTimeForVSBug = 0;
const REGEXP_MAP = {
    ".": "\\.",
    "+": "\\+",
    "?": "\\?",
    "[": "\\[",
    "]": "\\]",
    "^": "^]",
    "$": "$]",
    "*": "[^/]*",
    "**": ".*"
};
var ConfigState;
(function (ConfigState) {
    ConfigState[ConfigState["NOTFOUND"] = 0] = "NOTFOUND";
    ConfigState[ConfigState["INVALID"] = 1] = "INVALID";
    ConfigState[ConfigState["LOADED"] = 2] = "LOADED";
})(ConfigState = exports.ConfigState || (exports.ConfigState = {}));
function patternToRegExp(pattern) {
    let regexp = pattern.replace(/([.?+\[\]^$]|\*\*?)/g, chr => REGEXP_MAP[chr]);
    if (regexp.startsWith("/"))
        regexp = "^" + regexp;
    else
        regexp = ".*/" + regexp;
    if (!regexp.endsWith("/"))
        regexp += "(/.*)?$";
    return new RegExp(regexp);
}
function testInitTimeBiasForVSBug() {
    if (initTimeForVSBug) {
        const inittime = initTimeForVSBug;
        initTimeForVSBug = 0;
        if (Date.now() <= inittime + 500) {
            return true;
        }
    }
    return false;
}
exports.testInitTimeBiasForVSBug = testInitTimeBiasForVSBug;
class Config extends ftpkr_config_1.FtpKrConfig {
    constructor(workspace) {
        super(workspace);
        this.workspace = workspace;
        this.state = ConfigState.NOTFOUND;
        this.lastError = null;
        this.onLoad = event_1.Event.make('onLoad', false);
        this.onLoadAfter = event_1.Event.make('onLoadAfter', false);
        this.onInvalid = event_1.Event.make('onInvalid', false);
        this.onNotFound = event_1.Event.make('onNotFound', true);
        this.ignorePatterns = null;
        this.logger = workspace.query(log_1.Logger);
        this.scheduler = workspace.query(work_1.Scheduler);
        this.basePath = undefined;
    }
    dispose() {
    }
    modifySave(cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const json = yield this.path.json();
            cb(json);
            cb(this);
            yield this.path.create(JSON.stringify(json, null, 4));
        });
    }
    updateIgnorePath() {
        this.ignorePatterns = null;
    }
    /**
     * if true, path needs to ignore
     */
    checkIgnorePath(path) {
        if (!this.ignorePatterns) {
            this.ignorePatterns = this.ignore.map(patternToRegExp);
        }
        const pathFromWorkspace = '/' + path.relativeFrom(this.workspace);
        for (const pattern of this.ignorePatterns) {
            if (pattern.test(pathFromWorkspace)) {
                return true;
            }
        }
        return false;
    }
    init() {
        this.loadWrap('init', (task) => __awaiter(this, void 0, void 0, function* () {
            initTimeForVSBug = Date.now();
            yield this.initJson();
            vsutil_1.vsutil.open(this.path);
        }));
    }
    setState(newState, newLastError) {
        if (this.state === newState)
            return;
        this.state = newState;
        this.lastError = newLastError;
        this.logger.verbose(`${this.workspace.name}.state = ${ConfigState[newState]}`);
    }
    load() {
        this.loadWrap('config loading', task => this.readJson());
    }
    fireNotFound() {
        if (this.state === ConfigState.NOTFOUND)
            return Promise.resolve();
        this.setState(ConfigState.NOTFOUND, 'NOTFOUND');
        return this.onNotFound.fire();
    }
    fireInvalid(err) {
        if (this.state === ConfigState.INVALID)
            return Promise.resolve();
        this.setState(ConfigState.INVALID, err);
        return this.onInvalid.fire();
    }
    fireLoad(task) {
        return this.onLoad.fire(task).then(() => {
            this.logger.message("ftp-kr.json: loaded");
            if (this.state !== ConfigState.LOADED) {
                vsutil_1.vsutil.info('');
            }
            this.setState(ConfigState.LOADED, null);
        });
    }
    onLoadError(err) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (err) {
                case 'NOTFOUND':
                    this.logger.message("ftp-kr.json: not found");
                    yield this.fireNotFound();
                    throw 'IGNORE';
                case 'PASSWORD_CANCEL':
                    vsutil_1.vsutil.info('ftp-kr Login Request', 'Login').then(confirm => {
                        if (confirm === 'Login') {
                            this.loadWrap('login', task => Promise.resolve());
                        }
                    });
                    yield this.fireInvalid(err);
                    throw 'IGNORE';
                default:
                    if (err instanceof Error)
                        err.file = this.path;
                    yield this.fireInvalid(err);
                    throw err;
            }
        });
    }
    loadTest() {
        if (this.state !== ConfigState.LOADED) {
            if (this.state === ConfigState.NOTFOUND) {
                return Promise.reject('Config is not loaded. Retry it after load');
            }
            return this.onLoadError(this.lastError);
        }
        return Promise.resolve();
    }
    /**
     * path from localBasePath
     */
    workpath(file) {
        const workpath = file.relativeFrom(this.basePath);
        if (workpath === undefined) {
            if (this.basePath !== this.workspace) {
                throw Error(`${file.fsPath} is not in localBasePath`);
            }
            else {
                throw Error(`${file.fsPath} is not in workspace`);
            }
        }
        return '/' + workpath;
    }
    fromWorkpath(workpath, parent) {
        if (workpath.startsWith('/')) {
            return this.basePath.child(workpath.substr(1));
        }
        else {
            return parent.child(workpath);
        }
    }
    loadWrap(name, onwork) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.scheduler.cancel();
            try {
                yield this.scheduler.taskMust(name, (task) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield onwork(task);
                        this.ignorePatterns = null;
                        if (this.localBasePath) {
                            this.basePath = this.workspace.child(this.localBasePath);
                        }
                        else {
                            this.basePath = this.workspace;
                        }
                        this.logger.setLogLevel(this.logLevel);
                        yield this.fireLoad(task);
                    }
                    catch (err) {
                        yield this.onLoadError(err);
                    }
                }));
                yield this.onLoadAfter.fire();
            }
            catch (err) {
                yield error_1.processError(this.logger, err);
            }
        });
    }
}
exports.Config = Config;
//# sourceMappingURL=config.js.map