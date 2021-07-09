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
const FtpClientO = require("ftp");
const util = require("../util/util");
const fileinfo_1 = require("../util/fileinfo");
const fileinterface_1 = require("./fileinterface");
const sm_1 = require("../util/sm");
class FtpClient extends FtpClientO {
    // list(path: string, useCompression: boolean, callback: (error: Error, listing: Client.ListingElement[]) => void): void;
    // list(path: string, callback: (error: Error, listing: Client.ListingElement[]) => void): void;
    // list(useCompression: boolean, callback: (error: Error, listing: Client.ListingElement[]) => void): void;
    // list(callback: (error: Error, listing: Client.ListingElement[]) => void): void;
    list(path, zcomp, cb) {
        var pathcmd;
        if (typeof path === 'string') {
            pathcmd = '-al ' + path;
            if (typeof zcomp === 'function') {
                cb = zcomp;
                zcomp = false;
            }
            else if (typeof zcomp === 'boolean') {
                if (!cb)
                    throw Error('Invalid parameter');
            }
            else {
                if (!cb)
                    throw Error('Invalid parameter');
                zcomp = false;
            }
        }
        else if (typeof path === 'boolean') {
            if (typeof zcomp !== 'function') {
                throw Error('Invalid parameter');
            }
            cb = zcomp;
            zcomp = path;
            pathcmd = '-al';
            path = '';
        }
        else {
            cb = path;
            zcomp = false;
            pathcmd = '-al';
            path = '';
        }
        if (path.indexOf(' ') === -1)
            return super.list(pathcmd, zcomp, cb);
        const path_ = path;
        const callback = cb;
        // store current path
        this.pwd((err, origpath) => {
            if (err)
                return callback(err, []);
            // change to destination path
            this.cwd(path_, err => {
                if (err)
                    return callback(err, []);
                // get dir listing
                super.list('-al', false, (err, list) => {
                    // change back to original path
                    if (err)
                        return this.cwd(origpath, () => callback(err, []));
                    this.cwd(origpath, err => {
                        if (err)
                            return callback(err, []);
                        callback(err, list);
                    });
                });
            });
        });
    }
    terminate() {
        const anythis = this;
        if (anythis._pasvSock) {
            if (anythis._pasvSock.writable)
                anythis._pasvSock.destroy();
            anythis._pasvSock = undefined;
        }
        if (anythis._socket) {
            if (anythis._socket.writable)
                anythis._socket.destroy();
            anythis._socket = undefined;
        }
        anythis._reset();
    }
}
class FtpConnection extends fileinterface_1.FileInterface {
    constructor() {
        super(...arguments);
        this.client = null;
    }
    connected() {
        return this.client !== null;
    }
    _connect(password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.client)
                    throw Error('Already created');
                const client = this.client = new FtpClient;
                if (this.config.showGreeting) {
                    client.on('greeting', (msg) => this.log(msg));
                }
                var options;
                const config = this.config;
                if (config.protocol === 'ftps' || config.secure) {
                    options = {
                        secure: true,
                        secureOptions: {
                            rejectUnauthorized: false,
                        }
                    };
                }
                else {
                    options = {};
                }
                options.host = config.host;
                options.port = config.port ? config.port : 21;
                options.user = config.username;
                options.password = password;
                options = util.merge(options, config.ftpOverride);
                return yield new Promise((resolve, reject) => {
                    client.on("ready", () => {
                        if (!client)
                            return reject(Error(fileinterface_1.NOT_CREATED));
                        const socket = client._socket;
                        const oldwrite = socket.write;
                        socket.write = (str) => oldwrite.call(socket, str, 'binary');
                        socket.setEncoding('binary');
                        client.binary(err => {
                            if (err)
                                sm_1.printMappedError(err);
                            resolve();
                        });
                    })
                        .on("error", reject)
                        .connect(options);
                });
            }
            catch (err) {
                if (this.client) {
                    this.client.terminate();
                    this.client = null;
                }
                throw err;
            }
        });
    }
    disconnect() {
        if (this.client) {
            this.client.end();
            this.client = null;
        }
    }
    terminate() {
        if (this.client) {
            this.client.terminate();
            this.client = null;
        }
    }
    pwd() {
        const client = this.client;
        if (!client)
            return Promise.reject(Error(fileinterface_1.NOT_CREATED));
        return new Promise((resolve, reject) => {
            client.pwd((err, path) => {
                if (err)
                    reject(err);
                else
                    resolve(path);
            });
        });
    }
    static wrapToPromise(callback) {
        return new Promise((resolve, reject) => callback((err, val) => {
            if (err)
                reject(err);
            else
                resolve(val);
        }));
    }
    _rmdir(ftppath, recursive) {
        const client = this.client;
        if (!client)
            return Promise.reject(Error(fileinterface_1.NOT_CREATED));
        return FtpConnection.wrapToPromise(callback => client.rmdir(ftppath, recursive, callback))
            .catch(e => {
            if (e.code === 550)
                e.ftpCode = fileinterface_1.FILE_NOT_FOUND;
            throw e;
        });
    }
    _mkdir(ftppath, recursive) {
        const client = this.client;
        if (!client)
            return Promise.reject(Error(fileinterface_1.NOT_CREATED));
        return FtpConnection.wrapToPromise(callback => client.mkdir(ftppath, recursive, callback));
    }
    _delete(ftppath) {
        const client = this.client;
        if (!client)
            return Promise.reject(Error(fileinterface_1.NOT_CREATED));
        return FtpConnection.wrapToPromise(callback => client.delete(ftppath, callback))
            .catch(e => {
            if (e.code === 550)
                e.ftpCode = fileinterface_1.FILE_NOT_FOUND;
            throw e;
        });
    }
    _put(localpath, ftppath) {
        const client = this.client;
        if (!client)
            return Promise.reject(Error(fileinterface_1.NOT_CREATED));
        return FtpConnection.wrapToPromise(callback => client.put(localpath.fsPath, ftppath, callback))
            .catch(e => {
            if (e.code === 553)
                e.ftpCode = fileinterface_1.DIRECTORY_NOT_FOUND;
            else if (e.code === 550)
                e.ftpCode = fileinterface_1.DIRECTORY_NOT_FOUND;
            throw e;
        });
    }
    _get(ftppath) {
        const client = this.client;
        if (!client)
            return Promise.reject(Error(fileinterface_1.NOT_CREATED));
        return FtpConnection.wrapToPromise(callback => client.get(ftppath, callback))
            .catch(e => {
            if (e.code === 550) {
                e.ftpCode = fileinterface_1.FILE_NOT_FOUND;
            }
            throw e;
        });
    }
    _list(ftppath) {
        const client = this.client;
        if (!client)
            return Promise.reject(Error(fileinterface_1.NOT_CREATED));
        return FtpConnection.wrapToPromise(callback => client.list(ftppath, false, callback))
            .then(list => list.map(from => {
            const to = new fileinfo_1.FileInfo;
            to.type = from.type;
            to.name = from.name;
            to.date = +from.date;
            to.size = +from.size;
            to.link = from.target;
            return to;
        }), e => {
            if (e.code === 550)
                return [];
            throw e;
        });
    }
    _readlink(fileinfo, ftppath) {
        if (fileinfo.link === undefined)
            return Promise.reject(ftppath + ' is not symlink');
        return Promise.resolve(fileinfo.link);
    }
}
exports.FtpConnection = FtpConnection;
//# sourceMappingURL=ftp.js.map