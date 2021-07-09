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
const filesystem_1 = require("./util/filesystem");
const log_1 = require("./vsutil/log");
const vsutil_1 = require("./vsutil/vsutil");
const work_1 = require("./vsutil/work");
const config_1 = require("./config");
const ftpcacher_1 = require("./ftpcacher");
const ftptree_1 = require("./ftptree");
class FtpSyncManager {
    constructor(workspace) {
        this.workspace = workspace;
        this.servers = new Map;
        this.fs = new filesystem_1.VirtualFileSystem;
        this.targetServer = null;
        this.mainServer = null;
        this.logger = workspace.query(log_1.Logger);
        this.config = workspace.query(config_1.Config);
        this.scheduler = workspace.query(work_1.Scheduler);
        this.cacheFile = this.workspace.child('.vscode/ftp-kr.sync.cache.json');
        this.fs.onRefreshContent(file => ftptree_1.ftpTree.refreshContent(file));
        this.fs.onRefreshTree(file => ftptree_1.ftpTree.refreshTree(file));
    }
    _getServerFromIndex(index) {
        if (index > 0 && index <= this.config.altServer.length) {
            const server = this.servers.get(this.config.altServer[index - 1]);
            if (server)
                return server;
        }
        const server = this.servers.get(this.config);
        if (!server)
            throw Error('Main server not found');
        return server;
    }
    clear() {
        for (const server of this.servers.values()) {
            ftptree_1.ftpTree.removeServer(server);
            server.terminate();
        }
        this.servers.clear();
        this.mainServer = null;
        this.targetServer = null;
    }
    onLoadConfig(task) {
        return __awaiter(this, void 0, void 0, function* () {
            var targetServerIndex = this.targetServer ? this.targetServer.config.index : 0;
            try {
                if (this.config.createSyncCache) {
                    const extra = yield this.fs.load(this.cacheFile, '');
                    if ("$targetServer" in extra)
                        targetServerIndex = Number(extra.$targetServer || 0);
                }
            }
            catch (err) {
            }
            this.clear();
            const mainServer = new ftpcacher_1.FtpCacher(this.workspace, this.config, this.fs);
            this.servers.set(this.config, mainServer);
            this.mainServer = mainServer;
            ftptree_1.ftpTree.addServer(mainServer);
            for (const config of this.config.altServer) {
                const server = new ftpcacher_1.FtpCacher(this.workspace, config, this.fs);
                this.servers.set(config, server);
                ftptree_1.ftpTree.addServer(server);
            }
            ftptree_1.ftpTree.refreshTree();
            this.targetServer = this._getServerFromIndex(targetServerIndex) || mainServer;
        });
    }
    onNotFoundConfig() {
        this.clear();
        ftptree_1.ftpTree.refreshTree();
    }
    dispose() {
        try {
            if (this.config.createSyncCache) {
                const using = new Set();
                for (const config of this.servers.keys()) {
                    using.add(config.hostUrl);
                }
                for (const server of this.fs.children()) {
                    if (using.has(server.name))
                        continue;
                    this.fs.deleteItem(server.name);
                }
                var extra = {};
                if (this.targetServer.config !== this.config) {
                    const targetServerUrl = this.targetServer.config.index;
                    if (targetServerUrl)
                        extra.$targetServer = targetServerUrl;
                }
                this.fs.save(this.cacheFile, extra);
            }
            for (const server of this.servers.values()) {
                ftptree_1.ftpTree.removeServer(server);
                server.terminate();
            }
            this.servers.clear();
        }
        catch (err) {
            console.error(err);
        }
    }
    selectServer(openAlways) {
        return __awaiter(this, void 0, void 0, function* () {
            var selected = undefined;
            const pick = new vsutil_1.QuickPick;
            for (const server of this.servers.values()) {
                const config = server.config;
                var name;
                if (server.config === this.config)
                    name = 'Main Server';
                else
                    name = config.name || config.host;
                if (server === this.targetServer)
                    name += ' *';
                pick.item(name, () => { selected = this.servers.get(config); });
            }
            if (!openAlways && pick.items.length === 1) {
                pick.items[0].onselect();
            }
            else {
                if (pick.items.length === 0)
                    throw Error('Server not found');
                yield pick.open();
            }
            return selected;
        });
    }
    reconnect(task) {
        return this.scheduler.taskMust('Reconnect', task => {
            this.targetServer.terminate();
            return this.targetServer.init(task);
        }, task);
    }
    runTaskJson(taskName, taskjson, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const selected = yield this.selectServer();
            if (selected === undefined)
                return;
            const tasks = yield taskjson.json();
            yield selected.runTaskJsonWithConfirm(taskName, tasks, taskjson.basename(), taskjson.parent(), options);
        });
    }
}
exports.FtpSyncManager = FtpSyncManager;
//# sourceMappingURL=ftpsync.js.map