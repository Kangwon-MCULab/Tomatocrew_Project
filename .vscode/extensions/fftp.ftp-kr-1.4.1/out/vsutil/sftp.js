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
const ssh2_1 = require("ssh2");
const fileinfo_1 = require("../util/fileinfo");
const util_1 = require("../util/util");
const fileinterface_1 = require("./fileinterface");
class SftpConnection extends fileinterface_1.FileInterface {
    constructor(workspace, config) {
        super(workspace, config);
        this.client = null;
        this.sftp = null;
    }
    connected() {
        return this.client !== null;
    }
    _connect(password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.client)
                    throw Error('Already created');
                const client = this.client = new ssh2_1.Client;
                if (this.config.showGreeting) {
                    client.on('banner', (msg) => this.log(msg));
                }
                var options = {};
                const config = this.config;
                if (config.privateKey) {
                    var keyPath = config.privateKey;
                    const keybuf = yield this.workspace.child('.vscode', keyPath).open();
                    options.privateKey = keybuf;
                    options.passphrase = config.passphrase;
                }
                else {
                    options.password = password;
                }
                options.host = config.host;
                options.port = config.port ? config.port : 22,
                    options.username = config.username;
                // options.hostVerifier = (keyHash:string) => false;
                options = util_1.merge(options, config.sftpOverride);
                return yield new Promise((resolve, reject) => {
                    client.on('ready', resolve)
                        .on('error', reject)
                        .connect(options);
                });
            }
            catch (err) {
                this._endSftp();
                if (this.client) {
                    this.client.destroy();
                    this.client = null;
                }
                throw err;
            }
        });
    }
    disconnect() {
        this._endSftp();
        if (this.client) {
            this.client.end();
            this.client = null;
        }
    }
    terminate() {
        this._endSftp();
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }
    }
    exec(command) {
        return util_1.promiseErrorWrap(new Promise((resolve, reject) => {
            if (!this.client)
                return reject(Error(fileinterface_1.NOT_CREATED));
            this._endSftp();
            this.client.exec(command, (err, stream) => {
                if (err)
                    return reject(err);
                var data = '';
                var errs = '';
                stream.on('data', (stdout, stderr) => {
                    if (stdout)
                        data += stdout;
                    if (stderr)
                        errs += stderr;
                })
                    .on('error', (err) => reject(err))
                    .on('exit', (code, signal) => {
                    if (errs)
                        reject(Error(errs));
                    else
                        resolve(data.trim());
                    stream.end();
                });
            });
        }));
    }
    pwd() {
        return this.exec('pwd');
    }
    _endSftp() {
        if (this.sftp) {
            this.sftp.end();
            this.sftp = null;
        }
    }
    _getSftp() {
        return new Promise((resolve, reject) => {
            if (this.sftp)
                return resolve(this.sftp);
            if (!this.client)
                return reject(Error(fileinterface_1.NOT_CREATED));
            this.client.sftp((err, sftp) => {
                this.sftp = sftp;
                if (err)
                    reject(err);
                else
                    resolve(sftp);
            });
        });
    }
    _readLink(ftppath) {
        return this._getSftp()
            .then(sftp => new Promise((resolve, reject) => {
            sftp.readlink(ftppath, (err, target) => {
                if (err)
                    return reject(err);
                resolve(target);
            });
        }));
    }
    _rmdirSingle(ftppath) {
        return this._getSftp()
            .then(sftp => new Promise((resolve, reject) => {
            return sftp.rmdir(ftppath, (err) => {
                if (err) {
                    if (err.code === 2)
                        err.ftpCode = fileinterface_1.FILE_NOT_FOUND;
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        }));
    }
    _rmdir(ftppath) {
        return __awaiter(this, void 0, void 0, function* () {
            const list = yield this.list(ftppath);
            if (list.length === 0) {
                return yield this._rmdirSingle(ftppath);
            }
            const parentPath = ftppath.endsWith('/') ? ftppath : ftppath + '/';
            for (const item of list) {
                const name = item.name;
                const subPath = name[0] === '/' ? name : parentPath + name;
                if (item.type === 'd') {
                    if (name !== '.' && name !== '..') {
                        yield this.rmdir(subPath);
                    }
                }
                else {
                    yield this.delete(subPath);
                }
            }
            return this.rmdir(ftppath);
        });
    }
    _delete(ftppath) {
        return this._getSftp()
            .then(sftp => new Promise((resolve, reject) => {
            sftp.unlink(ftppath, (err) => {
                if (err) {
                    if (err.code === 2)
                        err.ftpCode = fileinterface_1.FILE_NOT_FOUND;
                    reject(err);
                    return false;
                }
                resolve();
            });
        }));
    }
    _mkdirSingle(ftppath) {
        return this._getSftp()
            .then(sftp => new Promise((resolve, reject) => {
            sftp.mkdir(ftppath, (err) => {
                if (err) {
                    if (err.code !== 3 && err.code !== 4 && err.code !== 5) {
                        return reject(err);
                    }
                }
                resolve();
            });
        }));
    }
    _mkdir(ftppath) {
        return __awaiter(this, void 0, void 0, function* () {
            var idx = 0;
            for (;;) {
                const find = ftppath.indexOf('/', idx);
                if (find === -1)
                    break;
                idx = find + 1;
                const parentpath = ftppath.substr(0, find);
                if (!parentpath)
                    continue;
                yield this._mkdirSingle(parentpath);
            }
            yield this._mkdirSingle(ftppath);
        });
    }
    _put(localpath, ftppath) {
        return this._getSftp()
            .then(sftp => new Promise((resolve, reject) => {
            sftp.fastPut(localpath.fsPath, ftppath, (err) => {
                if (err) {
                    if (err.code === 2)
                        err.ftpCode = fileinterface_1.DIRECTORY_NOT_FOUND;
                    reject(err);
                    return;
                }
                resolve();
            });
        }));
    }
    _get(ftppath) {
        return this._getSftp()
            .then(sftp => new Promise((resolve, reject) => {
            const stream = sftp.createReadStream(ftppath, { encoding: null });
            stream.on('error', reject)
                .on('readable', () => resolve(stream));
        }))
            .catch(err => {
            if (err.code === 2)
                err.ftpCode = fileinterface_1.FILE_NOT_FOUND;
            else if (err.code === 550)
                err.ftpCode = fileinterface_1.FILE_NOT_FOUND;
            throw err;
        });
    }
    _list(ftppath) {
        return this._getSftp()
            .then(sftp => new Promise((resolve, reject) => {
            sftp.readdir(ftppath, (err, list) => {
                if (err) {
                    if (err.code === 2)
                        return resolve([]);
                    else if (err.code === 550)
                        return resolve([]);
                    else
                        reject(err);
                    return false;
                }
                if (!ftppath.endsWith('/'))
                    ftppath += '/';
                // reset file info
                const nlist = new Array(list.length);
                for (var i = 0; i < list.length; i++) {
                    const item = list[i];
                    const to = new fileinfo_1.FileInfo;
                    to.type = item.longname.substr(0, 1);
                    to.name = item.filename;
                    to.date = item.attrs.mtime * 1000;
                    to.size = +item.attrs.size;
                    // const reg = /-/gi;
                    // accessTime: item.attrs.atime * 1000,
                    // rights: {
                    // 	user: item.longname.substr(1, 3).replace(reg, ''),
                    // 	group: item.longname.substr(4,3).replace(reg, ''),
                    // 	other: item.longname.substr(7, 3).replace(reg, '')
                    // },
                    // owner: item.attrs.uid,
                    // group: item.attrs.gid
                    nlist[i] = to;
                }
                resolve(nlist);
            });
        }));
    }
    _readlink(fileinfo, ftppath) {
        if (fileinfo.link) {
            return Promise.resolve(fileinfo.link);
        }
        return this._getSftp()
            .then(sftp => new Promise((resolve, reject) => {
            sftp.readlink(ftppath, (err, target) => {
                if (err)
                    return reject(err);
                fileinfo.link = target;
                resolve(target);
            });
        }));
    }
}
exports.SftpConnection = SftpConnection;
//# sourceMappingURL=sftp.js.map