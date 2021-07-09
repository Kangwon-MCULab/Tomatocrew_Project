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
const fileinfo_1 = require("./fileinfo");
const event_1 = require("./event");
const ftp_path_1 = require("./ftp_path");
function splitFileName(path) {
    var pathidx = path.lastIndexOf('/');
    var dir = (pathidx === -1) ? "" : path.substr(0, pathidx);
    return {
        dir: dir,
        name: path.substr(pathidx + 1)
    };
}
exports.splitFileName = splitFileName;
class VFSState extends fileinfo_1.FileInfo {
    constructor(parent, name) {
        super();
        this.parent = parent;
        this.name = name;
        this.type = '';
        this.size = 0;
        this.date = 0;
        this.linkType = undefined;
        this.lmtime = 0;
        this.lmtimeWithThreshold = 0;
        this.modified = false;
        this.contentCached = false; // If it is set, fire refresh in next modification
        this.treeCached = false; // If it is set, fire refresh in next modification
        this.fs = parent ? parent.fs : this;
        if (!(this.fs instanceof VirtualFileSystem)) {
            throw Error('Invalid parameter');
        }
        this.server = (parent instanceof VFSServer) ? parent : parent ? parent.server : undefined;
    }
    getPath() {
        const list = [];
        var file = this;
        while (file && !(file instanceof VFSServer)) {
            list.push(file.name);
            file = file.parent;
        }
        list.push('');
        if (list.length === 1)
            return '/.';
        return list.reverse().join('/');
    }
    getUrl() {
        const list = [this.name];
        var parent = this.parent;
        while (parent && !(parent instanceof VirtualFileSystem)) {
            list.push(parent.name);
            parent = parent.parent;
        }
        return list.reverse().join('/');
    }
}
exports.VFSState = VFSState;
class VFSFileCommon extends VFSState {
    constructor(parent, name) {
        super(parent, name);
    }
    refreshContent() {
        if (!this.contentCached)
            return Promise.resolve();
        this.contentCached = false;
        return this.fs.onRefreshContent.fire(this);
    }
    setByStat(st) {
        this.size = st.size;
        this.lmtime = +st.mtime;
        this.lmtimeWithThreshold = this.lmtime + 1000;
    }
    setByInfo(file) {
        this.size = file.size;
        this.date = file.date;
    }
}
exports.VFSFileCommon = VFSFileCommon;
class VFSDirectory extends VFSFileCommon {
    constructor(parent, name) {
        super(parent, name);
        this.files = new Map();
        this.type = 'd';
        this.files.set('', this);
        this.files.set('.', this);
        if (this.parent)
            this.files.set('..', this.parent);
    }
    refreshContent() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const child of this.children()) {
                yield child.refreshContent();
            }
        });
    }
    serialize() {
        const files = {};
        for (const file of this.children()) {
            files[file.name] = file.serialize();
        }
        return files;
    }
    deserializeTo(filename, data) {
        var file;
        switch (data.type) {
            case '-':
                file = new VFSFile(this, filename);
                break;
            case 'l':
                file = new VFSSymLink(this, filename);
                break;
            default:
                file = new VFSDirectory(this, filename);
                break;
        }
        file.deserialize(data);
        this.setItem(filename, file);
    }
    deserialize(data) {
        if (typeof data !== 'object')
            return;
        for (const filename in data) {
            const sfile = data[filename];
            if (!sfile)
                continue;
            if (typeof sfile !== 'object')
                continue;
            this.deserializeTo(filename, sfile);
        }
    }
    setByInfos(list) {
        var nfiles = new Map();
        this.files.set('', this);
        this.files.set('.', this);
        if (this.parent)
            this.files.set('..', this.parent);
        var childrenChanged = false;
        for (var ftpfile of list) {
            _nofile: switch (ftpfile.name) {
                case undefined: break;
                case "..": break;
                case ".":
                    this.setByInfo(ftpfile);
                    break;
                default:
                    var file = this.files.get(ftpfile.name);
                    const oldfile = file;
                    if (!file || file.type !== ftpfile.type) {
                        switch (ftpfile.type) {
                            case 'd':
                                file = new VFSDirectory(this, ftpfile.name);
                                break;
                            case '-':
                                file = new VFSFile(this, ftpfile.name);
                                break;
                            case 'l':
                                file = new VFSSymLink(this, ftpfile.name);
                                break;
                            default: break _nofile;
                        }
                    }
                    if (oldfile) {
                        if (file !== oldfile) {
                            file.modified = true;
                            childrenChanged = true;
                            file.refreshContent();
                        }
                        else if (file.type === '-' && ftpfile.size !== file.size) {
                            file.modified = true;
                            file.refreshContent();
                        }
                    }
                    nfiles.set(ftpfile.name, file);
                    file.setByInfo(ftpfile);
                    break;
            }
        }
        this.files = nfiles;
        if (childrenChanged && this.treeCached) {
            this.treeCached = false;
            this.fs.onRefreshTree.fire(this);
        }
    }
    putBySerialized(path, data) {
        const fn = splitFileName(path);
        const dir = this.getDirectoryFromPath(fn.dir, true);
        dir.deserializeTo(fn.name, data);
    }
    putByStat(path, st) {
        const fn = splitFileName(path);
        const dir = this.getDirectoryFromPath(fn.dir, true);
        var file;
        if (st.isSymbolicLink())
            file = new VFSSymLink(dir, fn.name);
        else if (st.isDirectory())
            file = new VFSDirectory(dir, fn.name);
        else if (st.isFile())
            file = new VFSFile(dir, fn.name);
        else
            throw Error('invalid file');
        file.setByStat(st);
        dir.setItem(fn.name, file);
    }
    *children() {
        for (const [name, file] of this.files) {
            switch (name) {
                case '':
                case '.':
                case '..': continue;
            }
            yield file;
        }
    }
    item(name) {
        return this.files.get(name);
    }
    get fileCount() {
        return this.files.size;
    }
    setItem(name, item) {
        const old = this.files.get(name);
        this.files.set(name, item);
        if (old)
            old.refreshContent();
        if (this.treeCached) {
            if (!old || item.type === old.type) {
                this.treeCached = false;
                this.fs.onRefreshTree.fire(this);
            }
        }
    }
    deleteItem(name) {
        const old = this.files.get(name);
        if (!old)
            return false;
        old.refreshContent();
        this.files.delete(name);
        if (this.treeCached) {
            this.treeCached = false;
            this.fs.onRefreshTree.fire(this);
        }
        return true;
    }
    getDirectoryFromPath(path, make) {
        const dirs = path.split("/");
        var dir = this;
        for (const cd of dirs) {
            const ndir = dir.files.get(cd);
            if (ndir) {
                if (ndir instanceof VFSDirectory) {
                    dir = ndir;
                    continue;
                }
            }
            if (!make)
                return undefined;
            const maked = new VFSDirectory(dir, cd);
            dir.setItem(cd, maked);
            dir = maked;
        }
        return dir;
    }
    getFromPath(ftppath) {
        const parent = ftp_path_1.ftp_path.dirname(ftppath);
        const dir = this.getDirectoryFromPath(parent);
        if (!dir)
            return undefined;
        return dir.item(ftp_path_1.ftp_path.basename(ftppath));
    }
    createFromPath(path) {
        const fn = splitFileName(path);
        const dir = this.getDirectoryFromPath(fn.dir, true);
        const file = new VFSFile(dir, fn.name);
        dir.setItem(fn.name, file);
        return file;
    }
    deleteFromPath(path) {
        const fn = splitFileName(path);
        const dir = this.getDirectoryFromPath(fn.dir);
        if (dir)
            dir.deleteItem(fn.name);
    }
    mkdir(path) {
        return this.getDirectoryFromPath(path, true);
    }
    refresh(path, list) {
        const dir = this.getDirectoryFromPath(path, true);
        dir.setByInfos(list);
        return dir;
    }
}
exports.VFSDirectory = VFSDirectory;
class VFSServer extends VFSDirectory {
    constructor(fs, parent, name) {
        super(parent, name);
        this.fs = fs;
    }
}
exports.VFSServer = VFSServer;
class VFSSymLink extends VFSFileCommon {
    constructor(parent, name) {
        super(parent, name);
        this.type = 'l';
    }
    getLinkTarget() {
        if (!this.server)
            return undefined;
        var link = this;
        while (link instanceof VFSSymLink) {
            if (!link.link)
                return undefined;
            link = this.server.getFromPath(link.link);
        }
        return link;
    }
    refreshContent() {
        if (this.link) {
            const target = this.getLinkTarget();
            if (!target)
                return Promise.resolve();
            else
                return target.refreshContent();
        }
        else {
            return super.refreshContent();
        }
    }
    serialize() {
        return {
            type: this.type,
            size: this.size,
            lmtime: this.lmtime,
            modified: this.modified,
        };
    }
    deserialize(data) {
        this.size = Number(data.size) || 0;
        this.lmtime = Number(data.lmtime) || 0;
        this.modified = Boolean(data.modified);
    }
}
exports.VFSSymLink = VFSSymLink;
class VFSFile extends VFSFileCommon {
    constructor(parent, name) {
        super(parent, name);
        this.type = "-";
    }
    serialize() {
        return {
            type: this.type,
            size: this.size,
            lmtime: this.lmtime,
            modified: this.modified,
        };
    }
    deserialize(data) {
        this.size = Number(data.size) || 0;
        this.lmtime = Number(data.lmtime) || 0;
        this.modified = Boolean(data.modified);
    }
}
exports.VFSFile = VFSFile;
class VirtualFileSystem extends VFSDirectory {
    /// ftpList -> fire onRefreshTree -> refreshTree -> readTreeNode -> ftpList
    constructor() {
        super(undefined, '');
        this.onRefreshContent = event_1.Event.make('onRefreshContent', false);
        this.onRefreshTree = event_1.Event.make('onRefreshTree', false);
    }
    save(file, extra) {
        const obj = Object.assign(this.serialize(), extra);
        obj.$version = 1;
        file.createSync(JSON.stringify(obj, null, 2));
    }
    load(file, defaultRootUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const extra = {};
            const datatext = yield file.open();
            const data = JSON.parse(datatext);
            if (typeof data.$version !== 'object') {
                const version = data.$version;
                delete data.$version;
                switch (version) {
                    case 1:
                        for (const hostUrl in data) {
                            if (hostUrl.startsWith('$')) {
                                extra[hostUrl] = data[hostUrl];
                                continue;
                            }
                            const obj = data[hostUrl];
                            if (typeof obj !== 'object')
                                continue;
                            this.putBySerialized(hostUrl, obj);
                        }
                        return extra;
                }
            }
            this.putBySerialized(defaultRootUrl, data);
            return extra;
        });
    }
    children() {
        return super.children();
    }
    item(hostUrl) {
        const server = super.item(hostUrl);
        if (server)
            return server;
        const nserver = new VFSServer(this, this, hostUrl);
        this.setItem(hostUrl, nserver);
        return nserver;
    }
    setItem(name, item) {
        super.setItem(name, item);
    }
    putBySerialized(hostUrl, data) {
        const server = this.item(hostUrl);
        server.deserialize(data);
        return server;
    }
}
exports.VirtualFileSystem = VirtualFileSystem;
//# sourceMappingURL=filesystem.js.map