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
const krjson_1 = require("krjson");
const config_1 = require("./config");
const keys_1 = require("./keys");
const ftp_path_1 = require("./ftp_path");
const util = require("./util");
exports.DEFAULT_IGNORE_LIST = [
    ".git",
    "/.vscode",
];
const CONFIG_INIT = {
    host: "",
    username: "",
    password: "",
    remotePath: "",
    protocol: "ftp",
    port: 0,
    fileNameEncoding: "utf8",
    autoUpload: true,
    autoDelete: false,
    autoDownload: false,
    ignore: exports.DEFAULT_IGNORE_LIST,
};
function throwJsonError(data, match, message) {
    const matched = data.match(match);
    const err = Error(message);
    if (matched) {
        if (matched.index) {
            const { line, column } = util.getFilePosition(data, matched.index + matched[0].length);
            err.line = line;
            err.column = column;
        }
    }
    err.suppress = true;
    throw err;
}
function findUndupplicatedSet(dupPriority, obj, objs) {
    const dupmap = {};
    for (const prop of dupPriority) {
        const set = new Set;
        const value = obj[prop];
        for (const other of objs) {
            if (other === obj)
                continue;
            if (other[prop] === value) {
                set.add(other);
                break;
            }
        }
        dupmap[prop] = set;
    }
    function testDup(keys) {
        _notdup: for (const other of objs) {
            if (other === obj)
                continue;
            for (const key of keys) {
                if (dupmap[key].has(other))
                    continue;
                continue _notdup;
            }
            return false;
        }
        return true;
    }
    const all = 1 << dupPriority.length;
    for (var i = 1; i < all; i++) {
        var v = i;
        const arr = [];
        for (const prop of dupPriority) {
            if (v & 1)
                arr.push(prop);
            v >>= 1;
        }
        if (testDup(arr))
            return arr;
    }
    return [];
}
class FtpKrConfigClass extends config_1.ConfigContainer {
    constructor(workspaceDir) {
        super(["ignore", "autoUpload", "autoDelete", "autoDownload", "altServer", "localBasePath", "followLink", "autoDownloadAlways", "createSyncCache", "logLevel", "viewSizeLimit", "downloadTimeExtraThreshold", "ignoreRemoteModification", "ignoreJsonUploadCaution", "noticeFileCount", "remotePath", "protocol", "fileNameEncoding", "host", "username", "secure", "port", "ignoreWrongFileEncoding", "name", "password", "keepPasswordInMemory", "passphrase", "connectionTimeout", "autoDownloadRefreshTime", "refreshTime", "blockDetectingDuration", "privateKey", "showGreeting", "ftpOverride", "sftpOverride", "index", "url", "hostUrl", "passwordInMemory"]);
        this.path = workspaceDir.child('./.vscode/ftp-kr.json');
        this._configTypeClearing();
    }
    dispose() {
    }
    _serverTypeClearing(config, index) {
        if (typeof config.remotePath !== 'string')
            config.remotePath = '.';
        else if (!config.remotePath)
            config.remotePath = '.';
        else if (config.remotePath.endsWith("/"))
            config.remotePath = ftp_path_1.ftp_path.normalize(config.remotePath.substr(0, config.remotePath.length - 1));
        if (typeof config.protocol !== 'string')
            config.protocol = "ftp";
        if (typeof config.fileNameEncoding !== 'string')
            config.fileNameEncoding = 'utf8';
        if (typeof config.host !== 'string')
            config.host = config.host + '';
        if (typeof config.username !== 'string')
            config.username = config.username + '';
        config.secure = config.secure === true;
        if ("port" in config)
            config.port = (config.port || 0) | 0;
        config.ignoreWrongFileEncoding = config.ignoreWrongFileEncoding === true;
        if ('name' in config)
            config.name = config.name + '';
        if ("password" in config)
            config.password = config.password + '';
        config.keepPasswordInMemory = config.keepPasswordInMemory !== false;
        if ("passphrase" in config)
            config.passphrase = config.passphrase + '';
        config.connectionTimeout = Number(config.connectionTimeout || 60000);
        config.autoDownloadRefreshTime = config.refreshTime = Number(config.refreshTime || config.autoDownloadRefreshTime || 1000);
        config.blockDetectingDuration = Number(config.blockDetectingDuration || 8000);
        if ("privateKey" in config)
            config.privateKey = config.privateKey + '';
        config.showGreeting = config.showGreeting === true;
        if (typeof config.ftpOverride !== 'object')
            delete config.ftpOverride;
        if (typeof config.sftpOverride !== 'object')
            delete config.sftpOverride;
        // generate field
        config.index = index;
        var url = config.protocol;
        url += '://';
        url += config.host;
        if (config.port) {
            url += ':';
            url += config.port;
        }
        url += '/';
        url += config.remotePath;
        config.url = url;
        var hostUrl = config.protocol;
        hostUrl += '://';
        hostUrl += config.host;
        if (config.port) {
            hostUrl += ':';
            hostUrl += config.port;
        }
        hostUrl += '@';
        hostUrl += config.username;
        config.hostUrl = hostUrl;
        delete config.passwordInMemory;
    }
    _configTypeClearing() {
        // x !== false : default is true
        // x === true : default is false
        const config = this;
        if (!(config.ignore instanceof Array))
            config.ignore = exports.DEFAULT_IGNORE_LIST;
        config.autoUpload = config.autoUpload === true;
        config.autoDelete = config.autoDelete === true;
        config.autoDownload = config.autoDownload === true;
        if (!(config.altServer instanceof Array))
            config.altServer = [];
        if ((typeof config.localBasePath === 'string') && config.localBasePath) {
        }
        else {
            delete config.localBasePath;
        }
        config.followLink = config.followLink === true;
        if ('autoDownloadAlways' in config)
            config.autoDownloadAlways = Number(config.autoDownloadAlways || 0);
        config.createSyncCache = config.createSyncCache !== false;
        switch (config.logLevel) {
            case 'VERBOSE':
            case 'NORMAL':
            case 'ERROR':
                break;
            default:
                config.logLevel = 'NORMAL';
                break;
        }
        config.viewSizeLimit = Number(config.viewSizeLimit || 1024 * 1024 * 4);
        config.downloadTimeExtraThreshold = Number(config.downloadTimeExtraThreshold || 1000);
        config.ignoreRemoteModification = config.ignoreRemoteModification === true;
        if (typeof config.noticeFileCount !== 'number')
            config.noticeFileCount = 10;
        else {
            config.noticeFileCount = +config.noticeFileCount;
            if (config.noticeFileCount < 0)
                config.noticeFileCount = 10;
            else if (!isFinite(config.noticeFileCount))
                config.noticeFileCount = 10;
            else
                config.noticeFileCount = Math.floor(config.noticeFileCount);
        }
        delete config.name;
        this._serverTypeClearing(config, 0);
        for (var i = 0; i < config.altServer.length;) {
            if (typeof config.altServer[i] !== 'object') {
                config.altServer.splice(i, 1);
            }
            else {
                const altcfg = config.altServer[i++];
                this._serverTypeClearing(altcfg, i);
            }
        }
    }
    set(data) {
        var obj;
        try {
            obj = krjson_1.parseJson(data);
        }
        catch (err) {
            err.file = this.path;
            throw err;
        }
        if (!(obj instanceof Object)) {
            const error = new TypeError("Invalid json data type: " + typeof obj);
            error.suppress = true;
            throw error;
        }
        if ((typeof obj.host) !== 'string') {
            throwJsonError(data, /\"host\"[ \t\r\n]*\:[ \t\r\n]*/, 'host field must be string');
        }
        if (!obj.host) {
            throwJsonError(data, /\"host\"[ \t\r\n]*\:[ \t\r\n]*/, 'Need host');
        }
        if ((typeof obj.username) !== 'string') {
            throwJsonError(data, /\"username\"[ \t\r\n]*\:[ \t\r\n]*/, 'username field must be string');
        }
        if (!obj.username) {
            throwJsonError(data, /\"username\"[ \t\r\n]*\:/, 'username field must be string');
        }
        switch (obj.protocol) {
            case 'ftps':
            case 'sftp':
            case 'ftp': break;
            default:
                throwJsonError(data, /\"username\"[ \t\r\n]*\:/, `Unsupported protocol "${obj.protocol}"`);
        }
        this.clearConfig();
        this.appendConfig(obj);
        const config = this;
        if (!config.altServer || config.altServer.length === 0) {
            this._configTypeClearing();
            return;
        }
        const dupPriority = ['name', 'host', 'protocol', 'port', 'remotePath', 'username'];
        const servers = config.altServer;
        function removeFullDupped() {
            const fulldupped = new Set();
            _fullDupTest: for (const prop of dupPriority) {
                for (const server of servers) {
                    if (!(prop in server))
                        continue;
                    if (config[prop] !== server[prop])
                        continue _fullDupTest;
                }
                fulldupped.add(prop);
            }
            for (var i = 0; i < dupPriority.length;) {
                if (fulldupped.has(dupPriority[i])) {
                    dupPriority.splice(i, 1);
                }
                else {
                    i++;
                }
            }
        }
        removeFullDupped();
        for (const server of servers) {
            // copy main config
            for (const p of this.properties) {
                if (!(p in config))
                    continue;
                if (p in server)
                    continue;
                server[p] = util.clone(config[p]);
            }
            // make dupmap
            var usedprop = findUndupplicatedSet(dupPriority, server, servers);
            const nameidx = usedprop.indexOf('name');
            if (nameidx !== -1)
                usedprop.splice(nameidx, 1);
            var altname = '';
            if (usedprop.length !== 0) {
                if (server.host)
                    altname = server.host;
                for (const prop of usedprop) {
                    switch (prop) {
                        case 'protocol':
                            altname = server.protocol + '://' + altname;
                            break;
                        case 'port':
                            altname += ':' + server.port;
                            break;
                        case 'remotePath':
                            altname += '/' + server.remotePath;
                            break;
                        case 'username':
                            altname += '@' + server.username;
                            break;
                    }
                }
            }
            if (altname) {
                if (server.name)
                    server.name += `(${altname})`;
                else
                    server.name = altname;
            }
            else {
                if (!server.name)
                    server.name = server.host || '';
            }
        }
        this._configTypeClearing();
    }
    initJson() {
        return __awaiter(this, void 0, void 0, function* () {
            var obj;
            var data = '';
            var changed = false;
            try {
                data = yield this.path.open();
                obj = krjson_1.parseJson(data);
                for (const p in CONFIG_INIT) {
                    if (p in obj)
                        continue;
                    changed = true;
                    break;
                }
                Object.assign(obj, CONFIG_INIT);
            }
            catch (err) {
                obj = CONFIG_INIT;
                changed = true;
            }
            if (changed) {
                data = JSON.stringify(obj, null, 4);
                yield this.path.create(data);
            }
            this.set(data);
        });
    }
    readJson() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var data = yield this.path.open();
            }
            catch (err) {
                throw 'NOTFOUND';
            }
            this.set(data);
        });
    }
}
exports.FtpKrConfig = FtpKrConfigClass;
//# sourceMappingURL=ftpkr_config.js.map