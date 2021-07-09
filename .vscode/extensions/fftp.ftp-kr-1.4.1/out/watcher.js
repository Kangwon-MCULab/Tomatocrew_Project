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
const work_1 = require("./vsutil/work");
const ws_1 = require("./vsutil/ws");
const log_1 = require("./vsutil/log");
const error_1 = require("./vsutil/error");
const ftpsync_1 = require("./ftpsync");
const config_1 = require("./config");
var WatcherMode;
(function (WatcherMode) {
    WatcherMode[WatcherMode["NONE"] = 0] = "NONE";
    WatcherMode[WatcherMode["CONFIG"] = 1] = "CONFIG";
    WatcherMode[WatcherMode["FULL"] = 2] = "FULL";
})(WatcherMode || (WatcherMode = {}));
function ignoreVsCodeDir(config) {
    for (var i = 0; i < config.ignore.length;) {
        const ignore = config.ignore[i];
        if (ignore === '/.vscode') {
            config.ignore.splice(i, 1);
        }
        else if (ignore.startsWith('/.vscode/')) {
            config.ignore.splice(i, 1);
        }
        else {
            i++;
        }
    }
    config.ignore.push('/.vscode');
}
class WorkspaceWatcher {
    constructor(workspace) {
        this.workspace = workspace;
        this.watcherQueue = Promise.resolve();
        this.watcher = null;
        this.openWatcher = null;
        this.watcherMode = WatcherMode.NONE;
        this.openWatcherMode = false;
        this.logger = this.workspace.query(log_1.Logger);
        this.config = this.workspace.query(config_1.Config);
        this.scheduler = this.workspace.query(work_1.Scheduler);
        this.ftp = this.workspace.query(ftpsync_1.FtpSyncManager);
        this.config.onLoad((task) => __awaiter(this, void 0, void 0, function* () {
            yield this.ftp.onLoadConfig(task);
            this.attachWatcher(this.config.autoUpload || this.config.autoDelete ? WatcherMode.FULL : WatcherMode.CONFIG);
            this.attachOpenWatcher(this.config.autoDownload);
            if (!this.config.ignoreJsonUploadCaution && !this.config.checkIgnorePath(this.config.path)) {
                this.logger.errorConfirm("ftp-kr CAUTION: ftp-kr.json is uploaded to remote. Are you sure?", "Delete and Ignore /.vscode path", "It's OK").then((selected) => __awaiter(this, void 0, void 0, function* () {
                    switch (selected) {
                        case "Delete and Ignore /.vscode path":
                            this.config.updateIgnorePath();
                            for (const server of this.ftp.servers.values()) {
                                yield server.ftpDelete(this.config.basePath.child('.vscode'), task);
                            }
                            yield this.config.modifySave(cfg => ignoreVsCodeDir(cfg));
                            break;
                        case "It's OK":
                            yield this.config.modifySave(cfg => cfg.ignoreJsonUploadCaution = true);
                            break;
                    }
                }));
            }
        }));
        this.config.onLoadAfter(() => {
            if (this.ftp.mainServer === null)
                throw Error('MainServer not found');
            return this.ftp.mainServer.init();
        });
        this.config.onInvalid(() => {
            this.attachOpenWatcher(false);
            this.attachWatcher(WatcherMode.CONFIG);
        });
        this.config.onNotFound(() => {
            this.ftp.onNotFoundConfig();
            this.attachOpenWatcher(false);
            this.attachWatcher(WatcherMode.NONE);
        });
        this.config.path.exists().then(exists => {
            if (exists) {
                this.attachWatcher(WatcherMode.CONFIG);
                this.config.load();
            }
        });
        // It has many bug, not completed code
        // this.ftp.onCreated = path=>{
        // 	this.logger.verbose("ftp.onCreated: "+path);
        // };
        // this.ftp.onModified = path=>{
        // 	this.logger.verbose("ftp.onModified: "+path);
        // };
        // this.ftp.onDeleted = path=>{
        // 	this.logger.verbose("ftp.onDeleted: "+path);
        // };
    }
    dispose() {
        this.attachWatcher(WatcherMode.NONE);
    }
    processWatcher(path, workFunc, workName, autoSync) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (path.fsPath == this.config.path.fsPath) {
                    // #2. 와처가 바로 이전에 생성한 설정 파일에 반응하는 상황을 우회
                    if (config_1.testInitTimeBiasForVSBug()) {
                        if (workName === 'upload')
                            return;
                    }
                    this.logger.show();
                    this.config.load();
                    if (this.watcherMode === WatcherMode.CONFIG)
                        return;
                }
                if (!autoSync)
                    return;
                if (this.config.checkIgnorePath(path))
                    return;
                if (!path.in(this.config.basePath))
                    return;
                yield this.scheduler.taskMust(workName + ' ' + this.config.workpath(path), task => workFunc(task, path));
            }
            catch (err) {
                error_1.processError(this.logger, err);
            }
        });
    }
    attachOpenWatcher(mode) {
        if (this.openWatcherMode === mode)
            return;
        this.openWatcherMode = mode;
        if (mode) {
            this.openWatcher = vscode_1.workspace.onDidOpenTextDocument(e => {
                try {
                    const path = new krfile_1.File(e.uri.fsPath);
                    var workspace;
                    try {
                        workspace = ws_1.Workspace.fromFile(path);
                    }
                    catch (err) {
                        return;
                    }
                    const config = workspace.query(config_1.Config);
                    const scheduler = workspace.query(work_1.Scheduler);
                    const logger = workspace.query(log_1.Logger);
                    if (!config.autoDownload)
                        return;
                    if (config.checkIgnorePath(path))
                        return;
                    if (!path.in(this.config.basePath))
                        return;
                    scheduler.taskMust('download ' + config.workpath(path), task => this.ftp.targetServer.ftpDownloadWithCheck(path, task))
                        .catch(err => error_1.processError(this.logger, err));
                }
                catch (err) {
                    error_1.processError(this.logger, err);
                }
            });
        }
        else {
            if (this.openWatcher) {
                this.openWatcher.dispose();
                this.openWatcher = null;
            }
        }
    }
    uploadCascade(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const workspace = ws_1.Workspace.fromFile(path);
            const config = workspace.query(config_1.Config);
            this.processWatcher(path, (task, path) => this.ftp.targetServer.ftpUpload(path, task, { ignoreNotExistFile: true, cancelWhenLatest: true }), 'upload', !!config.autoUpload);
            try {
                if (!(yield path.isDirectory()))
                    return;
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    // already deleted
                    return;
                }
                throw err;
            }
            for (const cs of yield path.children()) {
                yield this.uploadCascade(cs);
            }
        });
    }
    attachWatcher(mode) {
        if (this.watcherMode === mode)
            return;
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = null;
        }
        this.watcherMode = mode;
        this.logger.verbose('watcherMode = ' + WatcherMode[mode]);
        var watcherPath;
        switch (this.watcherMode) {
            case WatcherMode.FULL:
                watcherPath = this.workspace.fsPath + "/**/*";
                break;
            case WatcherMode.CONFIG:
                watcherPath = this.config.path.fsPath;
                break;
            case WatcherMode.NONE:
                this.watcher = null;
                return;
            default: return;
        }
        this.watcher = vscode_1.workspace.createFileSystemWatcher(watcherPath);
        this.watcher.onDidChange(uri => {
            this.logger.verbose('watcher.onDidChange: ' + uri.fsPath);
            this.watcherQueue = this.watcherQueue.then(() => {
                const path = new krfile_1.File(uri.fsPath);
                return this.processWatcher(path, (task, path) => this.ftp.targetServer.ftpUpload(path, task, {
                    ignoreNotExistFile: true,
                    cancelWhenLatest: true,
                    whenRemoteModed: this.config.ignoreRemoteModification ? 'upload' : 'diff'
                }), 'upload', !!this.config.autoUpload);
            }).catch(err => this.logger.error(err));
        });
        this.watcher.onDidCreate(uri => {
            const path = new krfile_1.File(uri.fsPath);
            const workspace = ws_1.Workspace.fromFile(path);
            const logger = workspace.query(log_1.Logger);
            logger.verbose('watcher.onDidCreate: ' + uri.fsPath);
            this.watcherQueue = this.watcherQueue.then(() => {
                return this.uploadCascade(path);
            }).catch(err => logger.error(err));
        });
        this.watcher.onDidDelete(uri => {
            const path = new krfile_1.File(uri.fsPath);
            const workspace = ws_1.Workspace.fromFile(path);
            const logger = workspace.query(log_1.Logger);
            const config = workspace.query(config_1.Config);
            logger.verbose('watcher.onDidDelete: ' + uri.fsPath);
            this.watcherQueue = this.watcherQueue.then(() => {
                return this.processWatcher(path, (task, path) => this.ftp.targetServer.ftpDelete(path, task), 'remove', !!config.autoDelete);
            }).catch(err => logger.error(err));
        });
    }
}
exports.WorkspaceWatcher = WorkspaceWatcher;
//# sourceMappingURL=watcher.js.map