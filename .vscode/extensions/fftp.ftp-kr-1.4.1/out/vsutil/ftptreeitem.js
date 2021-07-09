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
const filesystem_1 = require("../util/filesystem");
const work_1 = require("./work");
const log_1 = require("./log");
const ftpTreeItemFromFile = new Map();
class FtpTreeItem extends vscode_1.TreeItem {
    constructor(label, ftpFile, server) {
        super(label, (!ftpFile || ftpFile.type === 'd') ? vscode_1.TreeItemCollapsibleState.Collapsed : vscode_1.TreeItemCollapsibleState.None);
        this.ftpFile = ftpFile;
        this.server = server || this;
        if (ftpFile) {
            FtpTreeItem.add(ftpFile, this);
            if (ftpFile.type === '-') {
                this.command = {
                    command: 'ftpkr.view',
                    title: 'View This',
                    arguments: [vscode_1.Uri.parse(ftpFile.getUrl())]
                };
            }
        }
    }
    static clear() {
        for (const items of ftpTreeItemFromFile.values()) {
            for (const item of items) {
                item.children = undefined;
            }
        }
        ftpTreeItemFromFile.clear();
    }
    static get(ftpFile) {
        const array = ftpTreeItemFromFile.get(ftpFile);
        if (array)
            return array;
        else
            return [];
    }
    static add(ftpFile, item) {
        var array = ftpTreeItemFromFile.get(ftpFile);
        if (!array)
            ftpTreeItemFromFile.set(ftpFile, array = []);
        array.push(item);
    }
    static delete(item) {
        if (!item.ftpFile)
            return;
        const array = ftpTreeItemFromFile.get(item.ftpFile);
        if (!array)
            return;
        for (var i = 0; i < array.length; i++) {
            if (array[i] !== item)
                continue;
            array.splice(i, 1);
            if (array.length === 0) {
                ftpTreeItemFromFile.delete(item.ftpFile);
            }
            if (item.children) {
                for (const child of item.children) {
                    FtpTreeItem.delete(child);
                }
                item.children = undefined;
            }
            break;
        }
    }
    static create(ftpFile, server) {
        for (const item of FtpTreeItem.get(ftpFile)) {
            if (item.server === server) {
                return item;
            }
        }
        return new FtpTreeItem(ftpFile.name, ftpFile, server);
    }
    compare(other) {
        return (other.collapsibleState || 0) - (this.collapsibleState || 0) || this.label.localeCompare(other.label);
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.children)
                return this.children;
            const items = yield this.server.getChildrenFrom(this);
            if (this.ftpFile)
                this.ftpFile.treeCached = true;
            this.children = items;
            return items;
        });
    }
}
exports.FtpTreeItem = FtpTreeItem;
class FtpTreeServer extends FtpTreeItem {
    constructor(workspace, ftp) {
        super(ftp.getName(), undefined);
        this.workspace = workspace;
        this.ftp = ftp;
        this.logger = this.workspace.query(log_1.Logger);
        this.scheduler = this.workspace.query(work_1.Scheduler);
        this.config = this.ftp.config;
    }
    dispose() {
        FtpTreeItem.delete(this);
    }
    getChildrenFrom(file) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!file.ftpFile) {
                yield this.ftp.init();
                file.ftpFile = this.ftp.home;
                FtpTreeItem.add(file.ftpFile, file);
            }
            const path = file.ftpFile.getPath();
            const files = [];
            const dir = yield this.ftp.ftpList(path);
            for (var childfile of dir.children()) {
                while (childfile instanceof filesystem_1.VFSSymLink) {
                    const putfile = childfile;
                    const nchildfile = yield this.ftp.ftpTargetStat(putfile);
                    if (!nchildfile)
                        return [];
                    childfile = nchildfile;
                }
                files.push(FtpTreeItem.create(childfile, this));
            }
            files.sort((a, b) => a.compare(b));
            return files;
        });
    }
    getChildren() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ftp.init();
            return yield _super("getChildren").call(this);
        });
    }
    downloadAsText(ftppath) {
        return this.ftp.downloadAsText(ftppath);
    }
}
exports.FtpTreeServer = FtpTreeServer;
//# sourceMappingURL=ftptreeitem.js.map