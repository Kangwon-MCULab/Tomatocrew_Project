"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iconv = require("iconv-lite");
const ftp_path_1 = require("../util/ftp_path");
const log_1 = require("./log");
const vsutil_1 = require("./vsutil");
const util_1 = require("../util/util");
exports.NOT_CREATED = 'not created connection access';
exports.DIRECTORY_NOT_FOUND = 1;
exports.FILE_NOT_FOUND = 2;
class FileInterface {
    constructor(workspace, config) {
        this.workspace = workspace;
        this.config = config;
        this.oninvalidencoding = () => { };
        this.logger = workspace.query(log_1.Logger);
        this.state = workspace.query(vsutil_1.StateBar);
    }
    connect(password) {
        return util_1.promiseErrorWrap(this._connect(password));
    }
    bin2str(bin) {
        var buf = iconv.encode(bin, 'binary');
        return iconv.decode(buf, this.config.fileNameEncoding);
    }
    str2bin(str) {
        var buf = iconv.encode(str, this.config.fileNameEncoding);
        return iconv.decode(buf, 'binary');
    }
    logWithState(command) {
        const message = this.config.name ? this.config.name + "> " + command : command;
        this.state.set(message);
        this.logger.message(message);
    }
    log(command) {
        const message = this.config.name ? this.config.name + "> " + command : command;
        this.logger.message(message);
    }
    _callWithName(name, ftppath, ignorecode, defVal, callback) {
        this.logWithState(name + ' ' + ftppath);
        return util_1.promiseErrorWrap(callback(this.str2bin(ftppath)).then(v => {
            this.state.close();
            return v;
        }, (err) => {
            this.state.close();
            if (err.ftpCode === ignorecode)
                return defVal;
            this.log(name + " fail: " + ftppath);
            throw err;
        }));
    }
    upload(ftppath, localpath) {
        this.logWithState('upload ' + ftppath);
        const binpath = this.str2bin(ftppath);
        return util_1.promiseErrorWrap(this._put(localpath, binpath)
            .catch(err => {
            if (err.ftpCode !== exports.DIRECTORY_NOT_FOUND)
                throw err;
            const idx = ftppath.lastIndexOf("/");
            if (idx <= 0)
                throw err;
            return this._mkdir(ftppath.substr(0, idx), true)
                .then(() => this._put(localpath, binpath));
        })
            .then(() => {
            this.state.close();
        }, err => {
            this.state.close();
            this.log("upload fail: " + ftppath);
            throw err;
        }));
    }
    download(localpath, ftppath) {
        this.logWithState('download ' + ftppath);
        return util_1.promiseErrorWrap(this._get(this.str2bin(ftppath))
            .then((stream) => {
            return new Promise((resolve, reject) => {
                stream.once('close', () => {
                    this.state.close();
                    resolve();
                });
                stream.once('error', (err) => {
                    this.state.close();
                    reject(err);
                });
                stream.pipe(localpath.createWriteStream());
            });
        }, err => {
            this.state.close();
            this.log("download fail: " + ftppath);
            throw err;
        }));
    }
    view(ftppath) {
        this.logWithState('view ' + ftppath);
        return util_1.promiseErrorWrap(this._get(this.str2bin(ftppath))
            .then((stream) => {
            return new Promise((resolve, reject) => {
                var str = '';
                stream.once('close', () => {
                    this.state.close();
                    resolve(str);
                });
                stream.once('error', (err) => {
                    this.state.close();
                    reject(err);
                });
                stream.on('data', (data) => {
                    str += data.toString('utf-8');
                });
            });
        }, err => {
            this.state.close();
            this.log("view fail: " + ftppath);
            throw err;
        }));
    }
    list(ftppath) {
        if (!ftppath)
            ftppath = ".";
        this.logWithState('list ' + ftppath);
        return util_1.promiseErrorWrap(this._list(this.str2bin(ftppath))
            .then((list) => {
            this.state.close();
            const errfiles = [];
            for (var i = 0; i < list.length; i++) {
                const file = list[i];
                const fn = file.name = this.bin2str(file.name);
                if (!this.config.ignoreWrongFileEncoding) {
                    if (fn.indexOf('�') !== -1 || fn.indexOf('?') !== -1)
                        errfiles.push(fn);
                }
            }
            if (errfiles.length) {
                setTimeout(() => this.oninvalidencoding(errfiles), 0);
            }
            return list;
        }, err => {
            this.state.close();
            this.log("list fail: " + ftppath);
            throw err;
        }));
    }
    rmdir(ftppath) {
        return this._callWithName("rmdir", ftppath, exports.FILE_NOT_FOUND, undefined, binpath => this._rmdir(binpath, true));
    }
    delete(ftppath) {
        return this._callWithName("delete", ftppath, exports.FILE_NOT_FOUND, undefined, binpath => this._delete(binpath));
    }
    mkdir(ftppath) {
        return this._callWithName("mkdir", ftppath, 0, undefined, binpath => this._mkdir(binpath, true));
    }
    readlink(fileinfo, ftppath) {
        if (fileinfo.type !== 'l')
            throw Error(ftppath + ' is not symlink');
        this.logWithState('readlink ' + fileinfo.name);
        return util_1.promiseErrorWrap(this._readlink(fileinfo, this.str2bin(ftppath))
            .then(v => {
            if (v.startsWith('/'))
                v = ftp_path_1.ftp_path.normalize(v);
            else
                v = ftp_path_1.ftp_path.normalize(ftppath + '/../' + v);
            fileinfo.link = v;
            this.state.close();
            return v;
        }, (err) => {
            this.state.close();
            this.log("readlink fail: " + fileinfo.name);
            throw err;
        }));
    }
}
exports.FileInterface = FileInterface;
//# sourceMappingURL=fileinterface.js.map