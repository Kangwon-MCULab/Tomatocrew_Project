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
const error_1 = require("./vsutil/error");
const log_1 = require("./vsutil/log");
const ftptreeitem_1 = require("./vsutil/ftptreeitem");
// private readonly viewCache:Map<string, ViewCache> = new Map;
const cacheMap = new Map();
function cache(path, cb) {
    var cached = cacheMap.get(path);
    if (cached)
        return cached;
    setTimeout(() => {
        cacheMap.delete(path);
    }, 500);
    const newcached = cb();
    cacheMap.set(path, newcached);
    return newcached;
}
class FtpContentProvider {
    constructor(scheme) {
        this.scheme = scheme;
        this._onDidChange = new vscode_1.EventEmitter();
        this.onDidChange = this._onDidChange.event;
    }
    provideTextDocumentContent(uri, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var logger = log_1.defaultLogger;
            try {
                const server = exports.ftpTree.getServerFromUri(uri);
                logger = server.logger;
                const ftppath = uri.path;
                const viewed = yield server.downloadAsText(ftppath);
                if (viewed.file)
                    viewed.file.contentCached = true;
                return viewed.content;
            }
            catch (err) {
                error_1.processError(logger, err);
                return '<Error>\n' + err ? (err.stack || err.message || err) : '';
            }
        });
    }
}
exports.FtpContentProvider = FtpContentProvider;
class FtpTree {
    constructor() {
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.map = new Map();
        this.contentProviders = new Map();
    }
    getContentProvider(scheme) {
        var cp = this.contentProviders.get(scheme);
        if (cp)
            return cp;
        cp = new FtpContentProvider(scheme);
        this.contentProviders.set(scheme, cp);
        return cp;
    }
    refreshContent(target) {
        log_1.defaultLogger.verbose('refreshContent ' + target.getUrl());
        const uri = vscode_1.Uri.parse(target.getUrl());
        const cp = this.contentProviders.get(uri.scheme);
        if (!cp)
            return;
        cp._onDidChange.fire();
    }
    refreshTree(target) {
        log_1.defaultLogger.verbose('refreshTree ' + (target ? target.getUrl() : "all"));
        if (!target) {
            ftptreeitem_1.FtpTreeItem.clear();
            this._onDidChangeTreeData.fire();
            for (const server of this.map.values()) {
                server.children = undefined;
                server.ftpFile = undefined;
            }
        }
        else {
            for (const item of ftptreeitem_1.FtpTreeItem.get(target)) {
                if (item.children) {
                    for (const child of item.children) {
                        ftptreeitem_1.FtpTreeItem.delete(child);
                    }
                    item.children = undefined;
                }
                if (item.server === item) {
                    item.ftpFile = undefined;
                }
                this._onDidChangeTreeData.fire(item);
            }
        }
    }
    getServerFromUri(uri) {
        for (const server of this.map.values()) {
            if (uri.scheme + '://' + uri.authority === server.config.hostUrl) {
                if (uri.path === server.ftp.remotePath || uri.path.startsWith(server.ftp.remotePath + '/')) {
                    return server;
                }
            }
        }
        throw Error('Server not found: ' + uri);
    }
    addServer(server) {
        const folder = new ftptreeitem_1.FtpTreeServer(server.workspace, server);
        this.map.set(server, folder);
    }
    removeServer(server) {
        const folder = this.map.get(server);
        if (folder) {
            this.map.delete(server);
            folder.dispose();
        }
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            var logger = log_1.defaultLogger;
            try {
                if (!element) {
                    return [...this.map.values()];
                }
                else {
                    logger = element.server.logger;
                    return yield element.getChildren();
                }
            }
            catch (err) {
                error_1.processError(logger, err);
                return [];
            }
        });
    }
}
exports.FtpTree = FtpTree;
exports.ftpTree = new FtpTree;
//# sourceMappingURL=ftptree.js.map