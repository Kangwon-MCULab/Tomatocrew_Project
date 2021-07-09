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
const sftp_1 = require("./vsutil/sftp");
const ftp_1 = require("./vsutil/ftp");
const vsutil_1 = require("./vsutil/vsutil");
const log_1 = require("./vsutil/log");
const config_1 = require("./config");
const util_1 = require("./util/util");
function createClient(workspace, config) {
    var newclient;
    switch (config.protocol) {
        case 'sftp':
            newclient = new sftp_1.SftpConnection(workspace, config);
            break;
        case 'ftp':
            newclient = new ftp_1.FtpConnection(workspace, config);
            break;
        case 'ftps':
            newclient = new ftp_1.FtpConnection(workspace, config);
            break;
        default: throw Error(`Invalid protocol ${config.protocol}`);
    }
    return newclient;
}
class FtpManager {
    constructor(workspace, config) {
        this.workspace = workspace;
        this.config = config;
        this.client = null;
        this.connectionInfo = '';
        this.destroyTimeout = null;
        this.cancelBlockedCommand = null;
        this.currentTask = null;
        this.connected = false;
        this.home = '';
        this.logger = workspace.query(log_1.Logger);
    }
    _cancelDestroyTimeout() {
        if (!this.destroyTimeout)
            return;
        clearTimeout(this.destroyTimeout);
        this.destroyTimeout = null;
    }
    _updateDestroyTimeout() {
        this._cancelDestroyTimeout();
        this.destroyTimeout = setTimeout(() => this.disconnect(), this.config.connectionTimeout);
    }
    _cancels() {
        this._cancelDestroyTimeout();
        if (this.cancelBlockedCommand) {
            this.cancelBlockedCommand();
            this.cancelBlockedCommand = null;
            this.currentTask = null;
        }
    }
    _makeConnectionInfo() {
        const config = this.config;
        const usepk = config.protocol === 'sftp' && !!config.privateKey;
        const datas = [
            config.protocol,
            config.username,
            config.password,
            config.host,
            config.port,
            usepk,
            usepk ? config.privateKey : '',
            usepk ? config.passphrase : ''
        ];
        return JSON.stringify(datas);
    }
    _blockTestWith(task, prom) {
        return task.with(new Promise((resolve, reject) => {
            if (this.cancelBlockedCommand) {
                const taskname = this.currentTask ? this.currentTask.name : 'none';
                throw Error(`Multiple order at same time (previous: ${taskname}, current: ${task.name})`);
            }
            var blockTimeout = setTimeout(() => {
                if (blockTimeout) {
                    this.cancelBlockedCommand = null;
                    this.currentTask = null;
                    blockTimeout = null;
                    reject('BLOCKED');
                }
            }, this.config.blockDetectingDuration);
            const stopTimeout = () => {
                if (blockTimeout) {
                    this.cancelBlockedCommand = null;
                    this.currentTask = null;
                    clearTimeout(blockTimeout);
                    blockTimeout = null;
                    return true;
                }
                return false;
            };
            this.currentTask = task;
            this.cancelBlockedCommand = () => {
                if (stopTimeout())
                    reject('CANCELLED');
            };
            prom.then(t => {
                if (stopTimeout())
                    resolve(t);
            }, err => {
                if (stopTimeout())
                    reject(err);
            });
        }));
    }
    _blockTestWrap(task, callback) {
        return util_1.promiseErrorWrap(this.connect(task).then((client) => __awaiter(this, void 0, void 0, function* () {
            for (;;) {
                this._cancelDestroyTimeout();
                try {
                    const t = yield this._blockTestWith(task, callback(client));
                    this._updateDestroyTimeout();
                    return t;
                }
                catch (err) {
                    this._updateDestroyTimeout();
                    if (err !== 'BLOCKED')
                        throw err;
                    this.terminate();
                    client = yield this.connect(task);
                }
            }
        })));
    }
    disconnect() {
        this._cancels();
        if (this.client) {
            if (this.connected) {
                this.client.log('Disconnected');
                this.connected = false;
            }
            this.client.disconnect();
            this.client = null;
        }
    }
    terminate() {
        this._cancels();
        if (this.client) {
            if (this.connected) {
                this.client.log('Disconnected');
                this.connected = false;
            }
            this.client.terminate();
            this.client = null;
        }
    }
    connect(task) {
        return __awaiter(this, void 0, void 0, function* () {
            const that = this;
            const coninfo = this._makeConnectionInfo();
            if (this.client) {
                if (coninfo === this.connectionInfo) {
                    this._updateDestroyTimeout();
                    return Promise.resolve(this.client);
                }
                this.terminate();
                this.config.passwordInMemory = undefined;
            }
            this.connectionInfo = coninfo;
            const config = this.config;
            const usepk = config.protocol === 'sftp' && !!config.privateKey;
            function tryToConnect(password) {
                return __awaiter(this, void 0, void 0, function* () {
                    for (;;) {
                        const client = createClient(that.workspace, config);
                        try {
                            that.logger.message(`Trying to connect to ${config.url} with user ${config.username}`);
                            yield that._blockTestWith(task, client.connect(password));
                            client.log('Connected');
                            that.client = client;
                            return;
                        }
                        catch (err) {
                            if (err !== 'BLOCKED')
                                throw err;
                            client.terminate();
                        }
                    }
                });
            }
            function tryToConnectOrErrorMessage(password) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield tryToConnect(password);
                        return undefined;
                    }
                    catch (err) {
                        var error;
                        switch (err.code) {
                            case 530:
                                error = 'Authentication failed';
                                break;
                            default:
                                switch (err.message) {
                                    case 'Login incorrect.':
                                    case 'All configured authentication methods failed':
                                        error = 'Authentication failed';
                                        break;
                                    default:
                                        that.terminate();
                                        throw err;
                                }
                                break;
                        }
                        that.logger.message(error);
                        return error;
                    }
                });
            }
            if (!usepk && config.password === undefined) {
                var errorMessage;
                if (this.config.passwordInMemory !== undefined) {
                    errorMessage = yield tryToConnectOrErrorMessage(this.config.passwordInMemory);
                    if (errorMessage !== undefined)
                        throw Error(errorMessage);
                }
                else
                    for (;;) {
                        const promptedPassword = yield vscode_1.window.showInputBox({
                            prompt: 'ftp-kr: ' + (config.protocol || '').toUpperCase() + " Password Request",
                            password: true,
                            ignoreFocusOut: true,
                            placeHolder: errorMessage
                        });
                        if (promptedPassword === undefined) {
                            this.terminate();
                            throw 'PASSWORD_CANCEL';
                        }
                        errorMessage = yield tryToConnectOrErrorMessage(promptedPassword);
                        if (errorMessage === undefined) {
                            if (config.keepPasswordInMemory) {
                                this.config.passwordInMemory = promptedPassword;
                            }
                            break;
                        }
                    }
            }
            else {
                try {
                    yield tryToConnect(config.password);
                }
                catch (err) {
                    this.terminate();
                    throw err;
                }
            }
            if (!this.client)
                throw Error('Client is not created');
            this.client.oninvalidencoding = (errfiles) => {
                this.logger.errorConfirm("Invalid encoding detected. Please set fileNameEncoding correctly\n" + errfiles.join('\n'), 'Open config', 'Ignore after')
                    .then((res) => {
                    switch (res) {
                        case 'Open config':
                            vsutil_1.vsutil.open(this.workspace.query(config_1.Config).path);
                            break;
                        case 'Ignore after':
                            return this.workspace.query(config_1.Config).modifySave(cfg => cfg.ignoreWrongFileEncoding = true);
                    }
                });
            };
            this.home = yield this.client.pwd();
            this._updateDestroyTimeout();
            return this.client;
        });
    }
    rmdir(task, ftppath) {
        return this._blockTestWrap(task, client => client.rmdir(ftppath));
    }
    remove(task, ftppath) {
        return this._blockTestWrap(task, client => client.delete(ftppath));
    }
    mkdir(task, ftppath) {
        return this._blockTestWrap(task, client => client.mkdir(ftppath));
    }
    upload(task, ftppath, localpath) {
        return this._blockTestWrap(task, client => client.upload(ftppath, localpath));
    }
    download(task, localpath, ftppath) {
        return this._blockTestWrap(task, client => client.download(localpath, ftppath));
    }
    view(task, ftppath) {
        return this._blockTestWrap(task, client => client.view(ftppath));
    }
    list(task, ftppath) {
        return this._blockTestWrap(task, client => client.list(ftppath));
    }
    readlink(task, fileinfo, ftppath) {
        return this._blockTestWrap(task, client => client.readlink(fileinfo, ftppath));
    }
}
exports.FtpManager = FtpManager;
//# sourceMappingURL=ftpmgr.js.map