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
const work_1 = require("./vsutil/work");
const log_1 = require("./vsutil/log");
const config_1 = require("./config");
const ftpsync_1 = require("./ftpsync");
const sm_1 = require("./util/sm");
class FtpDownloader {
    constructor(workspace) {
        this.timer = null;
        this.enabled = false;
        this.config = workspace.query(config_1.Config);
        this.logger = workspace.query(log_1.Logger);
        this.ftpmgr = workspace.query(ftpsync_1.FtpSyncManager);
        this.scheduler = workspace.query(work_1.Scheduler);
        this.config.onLoad(() => this._resetTimer());
    }
    dispose() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.enabled = false;
    }
    _resetTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.config.autoDownloadAlways) {
            this.enabled = true;
            this.timer = setTimeout(() => this.requestDownloadAll(), this.config.autoDownloadAlways);
        }
        else {
            this.enabled = false;
        }
    }
    requestDownloadAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._downloadDir(this.config.basePath);
                if (this.enabled) {
                    if (!this.config.autoDownloadAlways)
                        throw Error('Assert');
                    this.timer = setTimeout(() => this.requestDownloadAll(), this.config.autoDownloadAlways);
                }
            }
            catch (err) {
                this.logger.error(err);
            }
        });
    }
    _downloadDir(dir) {
        return __awaiter(this, void 0, void 0, function* () {
            const ftppath = this.ftpmgr.targetServer.toFtpPath(dir);
            const list = yield this.scheduler.taskMust(`downloadAlways.list`, task => this.ftpmgr.targetServer.ftpList(ftppath, task), null, work_1.PRIORITY_IDLE);
            if (!this.enabled)
                throw 'IGNORE';
            for (var child of list.children()) {
                const childFile = dir.child(child.name);
                if (this.config.checkIgnorePath(dir))
                    continue;
                try {
                    if (child.type === 'l') {
                        if (!this.config.followLink)
                            continue;
                        const stats = yield this.scheduler.taskMust(`downloadAlways.readLink`, task => this.ftpmgr.targetServer.ftpTargetStat(child, task), null, work_1.PRIORITY_IDLE);
                        if (!stats)
                            continue;
                        child = stats;
                    }
                    if (child.type === 'd') {
                        yield this._downloadDir(childFile);
                    }
                    else {
                        yield this.scheduler.taskMust(`downloadAlways`, task => this.ftpmgr.targetServer.ftpDownloadWithCheck(childFile, task), null, work_1.PRIORITY_IDLE);
                        if (!this.enabled)
                            throw 'IGNORE';
                    }
                }
                catch (err) {
                    sm_1.printMappedError(err);
                }
            }
        });
    }
}
exports.FtpDownloader = FtpDownloader;
//# sourceMappingURL=ftpdown.js.map