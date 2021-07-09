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
const ftp_path_1 = require("./util/ftp_path");
const filesystem_1 = require("./util/filesystem");
const util_1 = require("./util/util");
const fileinterface_1 = require("./vsutil/fileinterface");
const vsutil_1 = require("./vsutil/vsutil");
const log_1 = require("./vsutil/log");
const work_1 = require("./vsutil/work");
const config_1 = require("./config");
const ftpmgr_1 = require("./ftpmgr");
const sm_1 = require("./util/sm");
function isSameFile(file, local) {
    return __awaiter(this, void 0, void 0, function* () {
        if (local instanceof krfile_1.File) {
            try {
                local = yield local.stat();
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    if (!file)
                        return true;
                    return false;
                }
                throw err;
            }
        }
        if (!file)
            return false;
        switch (file.type) {
            case "-":
                if (!local.isFile())
                    return false;
                if (file instanceof filesystem_1.VFSFileCommon) {
                    if (local.size !== file.size)
                        return false;
                }
                break;
            case "d":
                if (!local.isDirectory())
                    return false;
                break;
            case "l":
                if (!local.isSymbolicLink())
                    return false;
                break;
        }
        return true;
    });
}
class RefreshedData extends util_1.Deferred {
    constructor() {
        super();
        this.accessTime = new Date().valueOf();
    }
}
class UploadReport {
}
exports.UploadReport = UploadReport;
class FtpCacher {
    constructor(workspace, config, fs) {
        this.workspace = workspace;
        this.config = config;
        this.refreshed = new Map;
        this.mainConfig = workspace.query(config_1.Config);
        this.config = config;
        this.ftpmgr = new ftpmgr_1.FtpManager(workspace, this.config);
        this.scheduler = workspace.query(work_1.Scheduler);
        this.fs = fs.item(config.hostUrl || '');
        this.logger = workspace.query(log_1.Logger);
        this.home = undefined;
        this.remotePath = undefined;
    }
    getName() {
        var name = this.workspace.name;
        if (this.config.name)
            name += '/' + this.config.name;
        return name;
    }
    init(task) {
        if (this.remotePath)
            return Promise.resolve();
        return this.scheduler.task('First Connect', (task) => __awaiter(this, void 0, void 0, function* () {
            yield this.ftpList(this.config.remotePath, task);
            const remotePath = this.config.remotePath;
            this.remotePath = remotePath.startsWith('/') ? remotePath : ftp_path_1.ftp_path.normalize(this.ftpmgr.home + '/' + remotePath);
            this.home = this.fs.getDirectoryFromPath(this.remotePath, true);
        }), task);
    }
    terminate() {
        this.ftpmgr.terminate();
    }
    toWorkPathFromFtpPath(ftppath) {
        ftppath = ftp_path_1.ftp_path.normalize(ftppath);
        if (ftppath === this.remotePath)
            return '.';
        if (!ftppath.startsWith(this.remotePath + '/'))
            throw Error(`${ftppath} is not in remotePath`);
        return ftppath.substr(this.remotePath.length + 1);
    }
    toFtpFileFromFtpPath(ftppath) {
        return this.fs.getFromPath(ftppath);
    }
    toFtpPath(path) {
        return ftp_path_1.ftp_path.normalize(this.remotePath + this.mainConfig.workpath(path));
    }
    toFtpFile(path) {
        return this.toFtpFileFromFtpPath(this.toFtpPath(path));
    }
    toFtpUrl(path) {
        const ftppath = this.toFtpPath(path);
        return this.config.hostUrl + ftppath;
    }
    fromFtpFile(ftpfile) {
        console.assert(ftpfile instanceof filesystem_1.VFSState);
        const ftppath = ftpfile.getPath();
        return this.fromFtpPath(ftppath);
    }
    fromFtpPath(ftppath) {
        return this.mainConfig.basePath.child(this.toWorkPathFromFtpPath(ftppath));
    }
    ftpDelete(path, task, options) {
        return this.scheduler.task('Delete', (task) => __awaiter(this, void 0, void 0, function* () {
            yield this.init(task);
            const ftppath = this.toFtpPath(path);
            const deleteTest = (file) => __awaiter(this, void 0, void 0, function* () {
                if (file instanceof filesystem_1.VFSDirectory)
                    yield this.ftpmgr.rmdir(task, ftppath);
                else
                    yield this.ftpmgr.remove(task, ftppath);
                this._fsDelete(ftppath);
            });
            var file = this.fs.getFromPath(ftppath);
            if (file) {
                try {
                    return yield deleteTest(file);
                }
                catch (err) {
                }
            }
            file = yield this.ftpStat(ftppath, task, options);
            if (!file)
                return;
            yield deleteTest(file);
        }), task);
    }
    ftpUpload(path, task, options) {
        return this.scheduler.task('Upload', (task) => __awaiter(this, void 0, void 0, function* () {
            yield this.init(task);
            const noptions = options || {};
            const ftppath = this.toFtpPath(path);
            const report = new UploadReport;
            var stats;
            var oldfile = undefined;
            try {
                stats = yield path.stat();
            }
            catch (e) {
                if (e.code === 'ENOENT' && noptions.ignoreNotExistFile) {
                    report.noFileIgnored = true;
                    return report;
                }
                throw e;
            }
            const next = () => __awaiter(this, void 0, void 0, function* () {
                if (stats.isDirectory()) {
                    if (noptions.doNotMakeDirectory) {
                        report.directoryIgnored = true;
                        return report;
                    }
                    if (oldfile) {
                        if (oldfile instanceof filesystem_1.VFSDirectory) {
                            oldfile.lmtimeWithThreshold = oldfile.lmtime = +stats.mtime;
                            report.file = oldfile;
                            return report;
                        }
                        yield this.ftpDelete(path, task).then(() => this.ftpmgr.mkdir(task, ftppath));
                    }
                    else {
                        yield this.ftpmgr.mkdir(task, ftppath);
                    }
                    const dir = this.fs.mkdir(ftppath);
                    dir.lmtimeWithThreshold = dir.lmtime = +stats.mtime;
                    dir.modified = false;
                    report.file = dir;
                    return report;
                }
                else {
                    const parentFtpPath = this.toFtpPath(path.parent());
                    try {
                        yield this.ftpmgr.upload(task, ftppath, path);
                    }
                    catch (e) {
                        if (e.code === 'ENOENT' && noptions.ignoreNotExistFile) {
                            report.noFileIgnored = true;
                            return report;
                        }
                        throw e;
                    }
                    const file = this.fs.createFromPath(ftppath);
                    file.lmtimeWithThreshold = file.lmtime = +stats.mtime;
                    file.size = stats.size;
                    report.file = file;
                    return report;
                }
            });
            const parentFtpPath = this.toFtpPath(path.parent());
            const filedir = this.fs.getDirectoryFromPath(parentFtpPath);
            if (!filedir)
                return yield next();
            oldfile = yield this.ftpStat(ftppath, task);
            if (!oldfile)
                return yield next();
            if (!noptions.cancelWhenLatest && noptions.whenRemoteModed === 'upload') {
                return yield next();
            }
            const mtime = +stats.mtime;
            const isLatest = mtime === oldfile.lmtime || mtime <= oldfile.lmtimeWithThreshold;
            if (isLatest) {
                if (noptions.cancelWhenLatest) {
                    report.latestIgnored = true;
                    report.file = oldfile;
                    return report;
                }
            }
            if (oldfile.modified) {
                switch (noptions.whenRemoteModed) {
                    case 'upload':
                        return yield next();
                    case 'ignore':
                        report.modifiedIgnored = true;
                        report.file = oldfile;
                        return report;
                    case 'error':
                        throw 'MODIFIED';
                    case 'diff':
                    default:
                        var diffFile;
                        try {
                            diffFile = yield this.ftpDiff(path, task, true);
                        }
                        catch (err) {
                            if (err === 'SAME') {
                                report.file = oldfile;
                                return report;
                            }
                            throw err;
                        }
                        vsutil_1.vsutil.info('Remote file modification detected', 'Upload', 'Download').then((selected) => __awaiter(this, void 0, void 0, function* () {
                            try {
                                yield diffFile.unlink();
                            }
                            catch (err) {
                            }
                            switch (selected) {
                                case 'Upload':
                                    yield this.ftpUpload(path, null, { doNotRefresh: true, whenRemoteModed: "upload" });
                                    break;
                                case 'Download':
                                    yield this.ftpDownload(path, null, { doNotRefresh: true });
                                    break;
                                case undefined:
                                    break;
                            }
                        }));
                        report.quickPickRequested = true;
                        report.file = oldfile;
                        return report;
                }
            }
            return yield next();
        }), task);
    }
    ftpDownload(path, task, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.scheduler.task('Download', (task) => __awaiter(this, void 0, void 0, function* () {
                yield this.init(task);
                const ftppath = this.toFtpPath(path);
                var file = this.fs.getFromPath(ftppath);
                if (!file) {
                    file = yield this.ftpStat(ftppath, task, options);
                    if (!file) {
                        throw Error(`Not found in remote: ${ftppath}`);
                    }
                }
                if (file.type === 'l') {
                    if (!this.mainConfig.followLink)
                        return;
                    do {
                        const nfile = yield this.ftpTargetStat(file, task);
                        if (!nfile)
                            return;
                        file = nfile;
                    } while (file.type === 'l');
                }
                if (file instanceof filesystem_1.VFSDirectory) {
                    yield path.mkdirp();
                }
                else {
                    yield path.parent().mkdirp();
                    yield this.ftpmgr.download(task, path, ftppath);
                }
                const stats = yield path.stat();
                if (file.type === '-' && file.size !== stats.size) {
                    file.refreshContent();
                }
                file.size = stats.size;
                file.lmtime = +stats.mtime;
                file.lmtimeWithThreshold = file.lmtime + this.mainConfig.downloadTimeExtraThreshold;
                file.modified = false;
            }), task);
        });
    }
    downloadAsText(ftppath, task) {
        return this.scheduler.task('View', (task) => __awaiter(this, void 0, void 0, function* () {
            var file = this.fs.getFromPath(ftppath);
            if (!file) {
                file = yield this.ftpStat(ftppath, task);
                if (!file) {
                    return {
                        content: '< File not found >\n' + ftppath
                    };
                }
            }
            if (file.size > this.mainConfig.viewSizeLimit)
                return {
                    content: '< File is too large >\nYou can change file size limit with "viewSizeLimit" option in ftp-kr.json'
                };
            const content = yield this.ftpmgr.view(task, ftppath);
            return {
                file,
                content
            };
        }), task);
    }
    ftpDownloadWithCheck(path, task) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init(task);
            const ftppath = this.toFtpPath(path);
            try {
                var stats = yield path.stat();
            }
            catch (e) {
                if (e.code === 'ENOENT')
                    return; // vscode open "%s.git" file, why?
                throw e;
            }
            const file = yield this.ftpStat(ftppath, task);
            if (!file || (file.lmtime !== 0 && file.lmtime < +stats.mtime)) {
                if (this.mainConfig === this.config && this.mainConfig.autoUpload) {
                    yield this.ftpUpload(path, task, { whenRemoteModed: this.mainConfig.ignoreRemoteModification ? 'ignore' : 'diff' });
                }
                else {
                    // diff?
                }
                return;
            }
            if (file instanceof filesystem_1.VFSFile && stats.size === file.size)
                return;
            if (file instanceof filesystem_1.VFSDirectory)
                yield path.mkdir();
            else {
                yield path.parent().mkdirp();
                yield this.ftpmgr.download(task, path, ftppath);
            }
            stats = yield path.stat();
            file.lmtime = +stats.mtime;
            file.lmtimeWithThreshold = file.lmtime + this.mainConfig.downloadTimeExtraThreshold;
            file.modified = false;
        });
    }
    ftpStat(ftppath, task, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const parent = ftp_path_1.ftp_path.dirname(ftppath);
            const dir = yield this.ftpList(parent, task, options);
            return dir.item(ftp_path_1.ftp_path.basename(ftppath));
        });
    }
    ftpTargetStat(linkfile, task) {
        return this.scheduler.task('Read Link', (task) => __awaiter(this, void 0, void 0, function* () {
            for (;;) {
                console.assert(linkfile instanceof filesystem_1.VFSState);
                const target = yield this.ftpmgr.readlink(task, linkfile, linkfile.getPath());
                const stats = yield this.ftpStat(target, task);
                if (!stats)
                    return undefined;
                linkfile = stats;
                if (linkfile.type !== 'l')
                    return linkfile;
            }
        }), task);
    }
    ftpDiff(file, task, sameCheck) {
        return this.scheduler.task('Diff', (task) => __awaiter(this, void 0, void 0, function* () {
            yield this.init(task);
            const basename = file.basename();
            const diffFile = yield this.workspace.child('.vscode/ftp-kr.diff.' + basename).findEmptyIndex();
            var title = basename + ' Diff';
            try {
                const ftppath = this.toFtpPath(file);
                yield this.ftpmgr.download(task, diffFile, ftppath);
            }
            catch (err) {
                if (err.ftpCode !== fileinterface_1.FILE_NOT_FOUND)
                    throw err;
                yield diffFile.create("");
                title += ' (NOT FOUND)';
            }
            if (sameCheck) {
                const remoteContent = yield diffFile.open();
                const localContent = yield file.open();
                if (remoteContent === localContent) {
                    yield diffFile.quietUnlink();
                    throw 'SAME';
                }
            }
            vsutil_1.vsutil.diff(diffFile, file, title).then(() => diffFile.quietUnlink());
            return diffFile;
        }), task);
    }
    ftpList(ftppath, task, options) {
        return this.scheduler.task('List', task => {
            const latest = this.refreshed.get(ftppath);
            if (latest) {
                if (options && options.doNotRefresh)
                    return latest;
                if (!options || !options.forceRefresh) {
                    if (latest.accessTime + this.mainConfig.refreshTime > Date.now())
                        return latest;
                }
            }
            const deferred = new RefreshedData;
            this.refreshed.set(ftppath, deferred);
            return (() => __awaiter(this, void 0, void 0, function* () {
                yield this.ftpmgr.connect(task);
                try {
                    const ftpfiles = yield this.ftpmgr.list(task, ftppath);
                    const dir = this.fs.refresh(ftppath, ftpfiles);
                    deferred.resolve(dir);
                    return dir;
                }
                catch (err) {
                    deferred.catch(() => { });
                    deferred.reject(err);
                    if (this.refreshed.get(ftppath) === deferred) {
                        this.refreshed.delete(ftppath);
                    }
                    throw err;
                }
            }))();
        }, task);
    }
    refresh(ftpFile) {
        if (ftpFile) {
            const ftppath = ftpFile.getPath();
            for (const path of this.refreshed.keys()) {
                if (ftppath === path || ftppath.startsWith(path + '/')) {
                    this.refreshed.delete(path);
                }
            }
        }
        else {
            this.refreshed.clear();
        }
    }
    runTaskJson(parentDirectory, tasklist, task, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init(task);
            var errorCount = 0;
            var modifiedCount = 0;
            const failedTasks = {};
            for (const workpath in tasklist) {
                const exec = tasklist[workpath];
                const path = this.mainConfig.fromWorkpath(workpath, parentDirectory);
                try {
                    switch (exec) {
                        case 'upload':
                            yield this.ftpUpload(path, task, options);
                            break;
                        case 'download':
                            yield this.ftpDownload(path, task, options);
                            break;
                        case 'delete':
                            yield this.ftpDelete(path, task, options);
                            break;
                        default:
                            const [cmd, preposition, relpath] = exec.split(/[ \t]+/g, 3);
                            switch (cmd) {
                                case 'upload':
                                    switch (preposition) {
                                        case 'from': {
                                            const ftppath = this.toFtpPath(path);
                                            const localpath = path.parent().child(relpath);
                                            yield this.ftpmgr.upload(task, ftppath, localpath);
                                            break;
                                        }
                                        case 'to': {
                                            const ftppath = ftp_path_1.ftp_path.normalize(this.toFtpPath(path.parent()) + '/' + relpath);
                                            yield this.ftpmgr.upload(task, ftppath, path);
                                            break;
                                        }
                                        default:
                                            throw Error(`Invalid command: ${exec}\n'upload from/to path'`);
                                    }
                                    break;
                                case 'download':
                                    switch (preposition) {
                                        case 'from': {
                                            const ftppath = ftp_path_1.ftp_path.normalize(this.toFtpPath(path.parent()) + '/' + relpath);
                                            yield this.ftpmgr.download(task, path, ftppath);
                                            break;
                                        }
                                        case 'to': {
                                            const ftppath = this.toFtpPath(path);
                                            const localpath = path.parent().child(relpath);
                                            yield this.ftpmgr.download(task, localpath, ftppath);
                                            break;
                                        }
                                        default:
                                            throw Error(`Invalid command: ${exec}\n'download from/to path'`);
                                    }
                                    break;
                                default:
                                    throw Error(`Invalid command: ${exec}\n'upload' or 'download' or 'upload to path' or 'download from path'`);
                            }
                            break;
                    }
                }
                catch (err) {
                    failedTasks[workpath] = exec;
                    if (err === 'MODIFIED') {
                        this.logger.message(workpath + ": Remote modification detected");
                        modifiedCount++;
                    }
                    else if (err.code === 'ENOENT') {
                        this.logger.message(workpath + ": File not found");
                    }
                    else {
                        sm_1.printMappedError(err);
                        this.logger.message(workpath + ": " + (err.message ? err.message : err));
                    }
                    errorCount++;
                }
            }
            if (errorCount)
                return { tasks: failedTasks, count: errorCount, modified: modifiedCount };
            else
                return null;
        });
    }
    runTaskJsonWithConfirm(taskName, tasks, taskname, parentDirectory, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var confirmer = null;
            if (options.confirmFirst) {
                confirmer = () => vsutil_1.vsutil.info("Review Operations to perform.", "OK");
            }
            for (;;) {
                if (util_1.isEmptyObject(tasks)) {
                    vsutil_1.vsutil.info("Nothing to DO");
                    return;
                }
                if (confirmer) {
                    const taskFile = this.workspace.child(".vscode/ftp-kr.task.json");
                    try {
                        yield taskFile.create(JSON.stringify(tasks, null, 1));
                        yield vsutil_1.vsutil.open(taskFile);
                        const res = yield confirmer();
                        if (res === undefined)
                            return;
                        const editor = yield vsutil_1.vsutil.open(taskFile);
                        if (editor)
                            yield editor.document.save();
                        const data = yield taskFile.json();
                    }
                    finally {
                        yield taskFile.quietUnlink();
                    }
                }
                this.logger.show();
                this.logger.message(taskname + ' started');
                const startTime = Date.now();
                const options = {
                    doNotRefresh: true,
                    whenRemoteModed: 'upload'
                };
                const failed = yield this.scheduler.task(taskName, task => this.runTaskJson(parentDirectory, tasks, task, options));
                if (!failed) {
                    const passedTime = Date.now() - startTime;
                    if (passedTime > 1000) {
                        vsutil_1.vsutil.info(taskname + " completed");
                    }
                    this.logger.show();
                    this.logger.message(taskname + ' completed');
                    return;
                }
                tasks = failed.tasks;
                confirmer = () => this.logger.errorConfirm("ftp-kr Task failed, more information in the output", "Retry");
            }
        });
    }
    uploadAll(path, task, options) {
        return this.scheduler.task('Upload All', (task) => __awaiter(this, void 0, void 0, function* () {
            const tasks = yield this._makeUploadTask(path, task);
            yield Promise.resolve();
            this.runTaskJsonWithConfirm(task.name, tasks, task.name, this.mainConfig.basePath, options || {});
        }), task);
    }
    downloadAll(path, task, options) {
        return this.scheduler.task('Download All', (task) => __awaiter(this, void 0, void 0, function* () {
            const tasks = yield this._makeDownloadTask(path, task);
            yield Promise.resolve();
            this.runTaskJsonWithConfirm(task.name, tasks, task.name, this.mainConfig.basePath, options || {});
        }), task);
    }
    deleteAll(path, task, options) {
        return this.scheduler.task('Delete All', (task) => __awaiter(this, void 0, void 0, function* () {
            const tasks = yield this._makeDeleteTask(path, task);
            yield Promise.resolve();
            this.runTaskJsonWithConfirm(task.name, tasks, task.name, this.mainConfig.basePath, options || {});
        }), task);
    }
    cleanAll(path, task, options) {
        return this.scheduler.task('Clean All', (task) => __awaiter(this, void 0, void 0, function* () {
            const tasks = yield this._makeCleanTask(path, task);
            yield Promise.resolve();
            this.runTaskJsonWithConfirm(task.name, tasks, task.name, this.mainConfig.basePath, options || {});
        }), task);
    }
    list(path) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            const openFile = (file) => {
                const npath = path.child(file.name);
                pick.clear();
                pick.item('Download ' + file.name, () => this.ftpDownload(npath));
                pick.item('Upload ' + file.name, () => this.ftpUpload(npath, null, { whenRemoteModed: this.mainConfig.ignoreRemoteModification ? 'upload' : 'diff' }));
                pick.item('Delete ' + file.name, () => this.ftpDelete(npath));
                pick.item('View ' + file.name, () => vsutil_1.vsutil.openUri(file.getUrl()));
                pick.item('Diff ' + file.name, () => this.ftpDiff(npath));
                pick.oncancel = () => this.list(path);
                return pick.open();
            };
            const openDirectory = (dir) => this.list(path.child(dir.name));
            const ftppath = this.toFtpPath(path);
            const dir = yield this.ftpList(ftppath);
            const pick = new vsutil_1.QuickPick;
            if (path.fsPath !== this.mainConfig.basePath.fsPath) {
                pick.item('Current Directory Action', () => {
                    const pick = new vsutil_1.QuickPick;
                    pick.item('Download Current VFSDirectory', () => this.downloadAll(path));
                    pick.item('Upload Current VFSDirectory', () => this.uploadAll(path));
                    pick.item('Delete Current VFSDirectory', () => this.ftpDelete(path));
                    pick.oncancel = () => this.list(path);
                    return pick.open();
                });
            }
            var files = [];
            var dirs = [];
            var links = [];
            if (this.mainConfig.basePath.fsPath !== path.fsPath) {
                pick.item('[DIR]\t..', () => this.list(path.parent()));
            }
            for (const file of dir.children()) {
                switch (file.type) {
                    case 'l':
                        links.push(file);
                        break;
                    case '-':
                        files.push(file);
                        break;
                    case 'd':
                        dirs.push(file);
                        break;
                }
            }
            files = files.sort((a, b) => a.name.localeCompare(b.name));
            links = links.sort((a, b) => a.name.localeCompare(b.name));
            dirs = dirs.sort((a, b) => a.name.localeCompare(b.name));
            for (const dir of dirs) {
                pick.item('[DIR]\t' + dir.name, () => openDirectory(dir));
            }
            for (const link of links) {
                pick.item('[LINK]\t' + link.name, () => __awaiter(this, void 0, void 0, function* () {
                    const stats = yield this.ftpTargetStat(link);
                    if (!stats)
                        return yield this.list(path);
                    switch (stats.type) {
                        case 'd':
                            return yield openDirectory(link);
                        case '-':
                            return yield openFile(stats);
                    }
                }));
            }
            for (const file of files) {
                pick.item('[FILE]\t' + file.name, () => openFile(file));
            }
            yield pick.open();
        });
    }
    _makeUploadTask(path, task) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init(task);
            const output = {};
            if (!(path instanceof Array))
                path = [path];
            for (const p of path) {
                if (yield p.isDirectory()) {
                    const list = {};
                    yield this._getUpdatedFile(this.home, p, list);
                    for (const workpath in list) {
                        const path = this.mainConfig.fromWorkpath(workpath, this.mainConfig.basePath);
                        const ftppath = this.toFtpPath(path);
                        const st = list[workpath];
                        const file = yield this.ftpStat(ftppath, task);
                        if (!(yield isSameFile(file, st))) {
                            output[workpath] = "upload";
                        }
                    }
                }
                else {
                    const workpath = this.mainConfig.workpath(p);
                    output[workpath] = "upload";
                }
            }
            return output;
        });
    }
    _makeDownloadTask(path, task) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init(task);
            const list = {};
            const _make = (ftpfile, file, dirlist) => __awaiter(this, void 0, void 0, function* () {
                if (this.mainConfig.checkIgnorePath(file))
                    return;
                if (ftpfile.type === 'l') {
                    if (!this.mainConfig.followLink)
                        return;
                    const nfile = yield this.ftpTargetStat(ftpfile, task);
                    if (!nfile)
                        return;
                    ftpfile = nfile;
                }
                if (!(yield isSameFile(ftpfile, file))) {
                    list[this.mainConfig.workpath(file)] = 'download';
                }
                if (ftpfile.type === 'd') {
                    dirlist.push(file);
                }
            });
            const _makeDir = (dir) => __awaiter(this, void 0, void 0, function* () {
                const ftppath = this.toFtpPath(dir);
                const ftpdir = yield this.ftpList(ftppath, task);
                const dirlist = [];
                for (var ftpfile of ftpdir.children()) {
                    const file = dir.child(ftpfile.name);
                    yield _make(ftpfile, file, dirlist);
                }
                for (const dir of dirlist) {
                    yield _makeDir(dir);
                }
            });
            if (!(path instanceof Array))
                path = [path];
            const dirlist = [];
            for (const file of path) {
                if (this.mainConfig.checkIgnorePath(file))
                    continue;
                const ftppath = this.toFtpPath(file);
                var ftpfile = yield this.ftpStat(ftppath, task);
                if (!ftpfile)
                    continue;
                if (ftpfile.type === 'l') {
                    if (!this.mainConfig.followLink)
                        continue;
                    const nfile = yield this.ftpTargetStat(ftpfile, task);
                    if (!nfile)
                        continue;
                    ftpfile = nfile;
                }
                list[this.mainConfig.workpath(file)] = 'download';
                if (ftpfile.type === 'd') {
                    dirlist.push(file);
                }
            }
            for (const dir of dirlist) {
                yield _makeDir(dir);
            }
            return list;
        });
    }
    _makeDeleteTask(path, task) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init(task);
            const list = {};
            const _make = (file) => __awaiter(this, void 0, void 0, function* () {
                if (this.mainConfig.checkIgnorePath(file))
                    return;
                if (file.fsPath === this.workspace.fsPath) {
                    const ftppath = this.toFtpPath(file);
                    const ftpdir = yield this.ftpList(ftppath, task);
                    for (const ftpfile_child of ftpdir.children()) {
                        yield _make(file.child(ftpfile_child.name));
                    }
                }
                else {
                    list[this.mainConfig.workpath(file)] = 'delete';
                }
            });
            if (!(path instanceof Array)) {
                path = [path];
            }
            if (path.length === 1) {
                const ftppath = this.toFtpPath(path[0]);
                const ftpfile = yield this.ftpStat(ftppath, task);
                if (!ftpfile)
                    return list;
                if (ftpfile.type === 'd') {
                    const ftpdir = yield this.ftpList(ftppath, task);
                    if (ftpdir.fileCount === 0) {
                        if (path[0].fsPath === this.workspace.fsPath)
                            return list;
                        list[this.mainConfig.workpath(path[0])] = 'delete';
                        return list;
                    }
                }
            }
            for (const p of path) {
                yield _make(p);
            }
            return list;
        });
    }
    _makeCleanTask(path, task) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init(task);
            const list = {};
            const _listNotExists = (path) => __awaiter(this, void 0, void 0, function* () {
                try {
                    var fslist = yield path.children();
                }
                catch (err) {
                    return;
                }
                const ftppath = this.toFtpPath(path);
                const dir = yield this.ftpList(ftppath, task);
                const targets = new Set();
                for (var file of dir.children()) {
                    const fullPath = path.child(file.name);
                    if (this.mainConfig.checkIgnorePath(fullPath))
                        continue;
                    if (file.type === 'l') {
                        if (!this.mainConfig.followLink)
                            continue;
                        const nfile = yield this.ftpTargetStat(file, task);
                        if (!nfile)
                            continue;
                        file = nfile;
                    }
                    targets.add(file.name);
                    if (file.type === 'd') {
                        yield _listNotExists(fullPath);
                    }
                }
                for (const file of fslist) {
                    targets.delete(file.basename());
                }
                for (const p of targets) {
                    list[this.mainConfig.workpath(path.child(p))] = 'delete';
                }
            });
            if (!(path instanceof Array))
                path = [path];
            for (const fullPath of path) {
                if (!(yield fullPath.isDirectory()))
                    continue;
                if (this.mainConfig.checkIgnorePath(fullPath))
                    continue;
                const ftppath = this.toFtpPath(fullPath);
                var file = yield this.ftpStat(ftppath, task);
                if (!file)
                    continue;
                if (file.type === 'l') {
                    if (!this.mainConfig.followLink)
                        continue;
                    const nfile = yield this.ftpTargetStat(file, task);
                    if (!nfile)
                        continue;
                    file = nfile;
                }
                if (file.type === 'd') {
                    yield _listNotExists(fullPath);
                }
            }
            return list;
        });
    }
    _getUpdatedFileInDir(cmp, path, list) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield path.children();
            for (const child of files) {
                var childfile;
                if (cmp) {
                    const file = cmp.item(child.basename());
                    if (file)
                        childfile = file;
                }
                yield this._getUpdatedFile(childfile, child, list);
            }
        });
    }
    _getUpdatedFile(cmp, path, list) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mainConfig.checkIgnorePath(path))
                return;
            try {
                const st = yield path.lstat();
                if (st.isDirectory())
                    yield this._getUpdatedFileInDir(cmp instanceof filesystem_1.VFSDirectory ? cmp : undefined, path, list);
                if (yield isSameFile(cmp, st))
                    return;
                list[this.mainConfig.workpath(path)] = st;
            }
            catch (err) {
            }
        });
    }
    _deletedir(dir, ftppath) {
        if (!this.refreshed.delete(ftppath))
            return;
        for (const child of dir.children()) {
            if (!(child instanceof filesystem_1.VFSDirectory))
                continue;
            this._deletedir(child, ftppath + '/' + child.name);
        }
    }
    _fsDelete(ftppath) {
        const dir = this.fs.getDirectoryFromPath(ftppath);
        if (dir)
            this._deletedir(dir, ftppath);
        this.fs.deleteFromPath(ftppath);
    }
}
exports.FtpCacher = FtpCacher;
//# sourceMappingURL=ftpcacher.js.map