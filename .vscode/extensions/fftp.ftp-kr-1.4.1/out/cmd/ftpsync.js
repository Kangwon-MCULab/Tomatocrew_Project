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
const vscode = require("vscode");
const vscode_1 = require("vscode");
const work_1 = require("../vsutil/work");
const log_1 = require("../vsutil/log");
const vsutil_1 = require("../vsutil/vsutil");
const ws_1 = require("../vsutil/ws");
const ftptree_1 = require("../ftptree");
const ftpsync_1 = require("../ftpsync");
const config_1 = require("../config");
const sshmgr_1 = require("../sshmgr");
function taskTimer(taskname, taskpromise) {
    const startTime = Date.now();
    return taskpromise.then(res => {
        const passedTime = Date.now() - startTime;
        if (passedTime > 1000) {
            vsutil_1.vsutil.info(taskname + " completed");
        }
        return res;
    });
}
function getInfoToTransfer(args) {
    return __awaiter(this, void 0, void 0, function* () {
        var workspace;
        var server;
        var file;
        var files;
        if (args.uri) {
            server = ftptree_1.ftpTree.getServerFromUri(args.uri).ftp;
            workspace = server.workspace;
            file = server.fromFtpPath(args.uri.path);
            files = [file];
        }
        else if (args.treeItem) {
            server = args.treeItem.server.ftp;
            workspace = server.workspace;
            if (!args.treeItem.ftpFile) {
                file = server.mainConfig.basePath;
            }
            else {
                file = server.fromFtpFile(args.treeItem.ftpFile);
            }
            files = [file];
        }
        else {
            if (!args.file) {
                yield vsutil_1.vsutil.info('File is not selected');
                throw 'IGNORE';
            }
            if (!args.workspace)
                throw Error('workspace is not defined');
            workspace = args.workspace;
            server = workspace.query(ftpsync_1.FtpSyncManager).targetServer;
            file = args.file;
            files = args.files || [file];
        }
        return { workspace, server, file, files };
    });
}
/**
 * return false if files not contains directory
 */
function isFileCountOver(files, count) {
    return __awaiter(this, void 0, void 0, function* () {
        function checkFiles(files) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const file of files) {
                    if (yield file.isDirectory()) {
                        const files = yield file.children();
                        count -= files.length;
                        if (count <= 0)
                            throw 'OVER';
                        yield checkFiles(files);
                    }
                }
            });
        }
        try {
            if (!(files instanceof Array))
                files = [files];
            checkFiles(files);
            return false;
        }
        catch (err) {
            if (err === 'OVER')
                return true;
            throw err;
        }
    });
}
function removeChildren(files) {
    const sorted = files.slice().sort(v => v.fsPath.length);
    for (var i = 0; i < sorted.length; i++) {
        const parent = sorted[i];
        if (!parent)
            continue;
        for (var j = i + 1; j < sorted.length; j++) {
            const child = sorted[j];
            if (!child)
                continue;
            if (child.in(parent)) {
                sorted[i] = null;
            }
        }
    }
    return sorted.filter(file => file !== null);
}
exports.commands = {
    'ftpkr.upload'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            var { workspace, server, files } = yield getInfoToTransfer(args);
            files = removeChildren(files);
            const logger = workspace.query(log_1.Logger);
            const config = workspace.query(config_1.Config);
            const scheduler = workspace.query(work_1.Scheduler);
            logger.show();
            yield config.loadTest();
            const bo = {
                whenRemoteModed: config.ignoreRemoteModification ? 'upload' : 'diff'
            };
            if (files.length === 1 && !(yield files[0].isDirectory())) {
                yield taskTimer('Upload', server.ftpUpload(files[0], null, bo));
            }
            else {
                bo.doNotRefresh = true;
                const confirmFirst = yield isFileCountOver(files, config.noticeFileCount);
                if (confirmFirst) {
                    bo.confirmFirst = true;
                    yield server.uploadAll(files, null, bo);
                }
                else {
                    yield taskTimer('Upload', server.uploadAll(files, null, bo));
                }
            }
        });
    },
    'ftpkr.download'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { workspace, server, files } = yield getInfoToTransfer(args);
            const logger = workspace.query(log_1.Logger);
            const config = workspace.query(config_1.Config);
            const scheduler = workspace.query(work_1.Scheduler);
            logger.show();
            yield config.loadTest();
            if (files.length === 1 && !(yield files[0].isDirectory())) {
                yield taskTimer('Download', server.ftpDownload(files[0], null, {}));
            }
            else {
                const confirmFirst = yield isFileCountOver(files, config.noticeFileCount);
                const bo = {
                    doNotRefresh: true
                };
                if (confirmFirst) {
                    bo.confirmFirst = true;
                    yield server.downloadAll(files, null, bo);
                }
                else {
                    yield taskTimer('Download', server.downloadAll(files, null, bo));
                }
            }
        });
    },
    'ftpkr.delete'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { workspace, server, files } = yield getInfoToTransfer(args);
            const logger = workspace.query(log_1.Logger);
            const config = workspace.query(config_1.Config);
            const scheduler = workspace.query(work_1.Scheduler);
            logger.show();
            yield config.loadTest();
            if (files.length === 1 && !(yield files[0].isDirectory())) {
                yield taskTimer('Delete', server.ftpDelete(files[0], null, {}));
            }
            else {
                const confirmFirst = yield isFileCountOver(files, config.noticeFileCount);
                if (confirmFirst) {
                    yield server.deleteAll(files, null, { confirmFirst });
                }
                else {
                    yield taskTimer('Delete', server.deleteAll(files, null, {}));
                }
            }
        });
    },
    'ftpkr.diff'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { workspace, server, file } = yield getInfoToTransfer(args);
            const logger = workspace.query(log_1.Logger);
            const config = workspace.query(config_1.Config);
            const scheduler = workspace.query(work_1.Scheduler);
            const ftp = workspace.query(ftpsync_1.FtpSyncManager);
            logger.show();
            yield config.loadTest();
            const isdir = yield file.isDirectory();
            if (isdir)
                throw Error('Diff only supported for file');
            yield server.ftpDiff(file);
        });
    },
    'ftpkr.uploadAll'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.workspace) {
                args.workspace = yield vsutil_1.vsutil.selectWorkspace();
                if (!args.workspace)
                    return;
            }
            const workspace = args.workspace;
            const config = workspace.query(config_1.Config);
            const scheduler = workspace.query(work_1.Scheduler);
            const ftp = workspace.query(ftpsync_1.FtpSyncManager);
            yield config.loadTest();
            yield vscode.workspace.saveAll();
            const server = yield ftp.selectServer();
            if (server === undefined)
                return;
            yield server.uploadAll(config.basePath, null, {
                confirmFirst: true,
                doNotRefresh: true,
                whenRemoteModed: config.ignoreRemoteModification ? 'upload' : 'error'
            });
        });
    },
    'ftpkr.downloadAll'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.workspace) {
                args.workspace = yield vsutil_1.vsutil.selectWorkspace();
                if (!args.workspace)
                    return;
            }
            const workspace = args.workspace;
            const config = workspace.query(config_1.Config);
            const scheduler = workspace.query(work_1.Scheduler);
            const ftp = workspace.query(ftpsync_1.FtpSyncManager);
            yield config.loadTest();
            yield vscode.workspace.saveAll();
            const server = yield ftp.selectServer();
            if (server === undefined)
                return;
            yield server.downloadAll(config.basePath, null, {
                confirmFirst: true,
                doNotRefresh: true
            });
        });
    },
    'ftpkr.cleanAll'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.workspace) {
                args.workspace = yield vsutil_1.vsutil.selectWorkspace();
                if (!args.workspace)
                    return;
            }
            const workspace = args.workspace;
            const config = workspace.query(config_1.Config);
            const scheduler = workspace.query(work_1.Scheduler);
            const ftp = workspace.query(ftpsync_1.FtpSyncManager);
            yield config.loadTest();
            yield vscode.workspace.saveAll();
            const server = yield ftp.selectServer();
            if (server === undefined)
                return;
            yield server.cleanAll(config.basePath, null, {
                confirmFirst: true,
                doNotRefresh: true
            });
        });
    },
    'ftpkr.refresh'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.uri) {
                const server = ftptree_1.ftpTree.getServerFromUri(args.uri).ftp;
                const ftpFile = server.toFtpFileFromFtpPath(args.uri.path);
                if (ftpFile) {
                    ftpFile.refreshContent();
                    ftptree_1.ftpTree.refreshTree(ftpFile);
                }
            }
            else if (args.treeItem && args.treeItem.ftpFile) {
                const tree = args.treeItem.server;
                const workspace = tree.workspace;
                yield workspace.query(config_1.Config).loadTest();
                tree.ftp.refresh(args.treeItem.ftpFile);
                args.treeItem.ftpFile.refreshContent();
                ftptree_1.ftpTree.refreshTree(args.treeItem.ftpFile);
            }
            else
                for (const workspace of ws_1.Workspace.all()) {
                    yield workspace.query(config_1.Config).loadTest();
                    const ftp = workspace.query(ftpsync_1.FtpSyncManager);
                    for (const server of ftp.servers.values()) {
                        yield server.fs.refreshContent();
                        server.refresh();
                    }
                    ftptree_1.ftpTree.refreshTree();
                }
        });
    },
    'ftpkr.list'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.workspace) {
                args.workspace = yield vsutil_1.vsutil.selectWorkspace();
                if (!args.workspace)
                    return;
            }
            const workspace = args.workspace;
            const config = workspace.query(config_1.Config);
            const scheduler = workspace.query(work_1.Scheduler);
            const ftp = workspace.query(ftpsync_1.FtpSyncManager);
            const selected = yield ftp.selectServer();
            if (selected === undefined)
                return;
            yield config.loadTest();
            yield selected.list(config.basePath);
        });
    },
    'ftpkr.view'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.uri) {
                if (!args.file)
                    return vsutil_1.vsutil.info('File is not selected');
                if (!args.workspace)
                    throw Error('workspace is not defined');
                const file = args.file;
                const ftp = args.workspace.query(ftpsync_1.FtpSyncManager);
                const scheduler = args.workspace.query(work_1.Scheduler);
                yield ftp.targetServer.init();
                const ftppath = ftp.targetServer.toFtpUrl(file);
                args.uri = vscode_1.Uri.parse(ftppath);
            }
            vsutil_1.vsutil.openUri(args.uri);
        });
    },
    'ftpkr.reconnect'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.workspace) {
                args.workspace = yield vsutil_1.vsutil.selectWorkspace();
                if (!args.workspace)
                    return;
            }
            const workspace = args.workspace;
            const config = workspace.query(config_1.Config);
            const scheduler = workspace.query(work_1.Scheduler);
            const ftp = workspace.query(ftpsync_1.FtpSyncManager);
            yield config.loadTest();
            yield scheduler.cancel();
            yield ftp.reconnect();
        });
    },
    'ftpkr.runtask'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.file)
                return vsutil_1.vsutil.info('Please select task.json file');
            if (!args.workspace)
                throw Error('workspace is not defined');
            if (args.file.ext() !== '.json') {
                return vsutil_1.vsutil.info('Please select task.json file');
            }
            const workspace = args.workspace;
            const config = workspace.query(config_1.Config);
            const scheduler = workspace.query(work_1.Scheduler);
            const ftp = workspace.query(ftpsync_1.FtpSyncManager);
            yield config.loadTest();
            yield vscode.workspace.saveAll();
            const path = args.file;
            ftp.runTaskJson('ftpkr.runtask', path, {
                whenRemoteModed: config.ignoreRemoteModification ? 'upload' : 'error'
            });
        });
    },
    'ftpkr.target'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.workspace) {
                args.workspace = yield vsutil_1.vsutil.selectWorkspace();
                if (!args.workspace)
                    return;
            }
            const ftp = args.workspace.query(ftpsync_1.FtpSyncManager);
            const server = yield ftp.selectServer(true);
            if (!server)
                return;
            ftp.targetServer = server;
        });
    },
    'ftpkr.ssh'(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.workspace) {
                args.workspace = yield vsutil_1.vsutil.selectWorkspace();
                if (!args.workspace)
                    return;
            }
            const ftp = args.workspace.query(ftpsync_1.FtpSyncManager);
            const server = yield ftp.selectServer();
            if (!server)
                return;
            sshmgr_1.openSshTerminal(server);
        });
    }
};
//# sourceMappingURL=ftpsync.js.map