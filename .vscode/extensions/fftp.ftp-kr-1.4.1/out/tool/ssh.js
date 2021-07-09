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
const read = require("read");
const krfile_1 = require("krfile");
const ftpkr_config_1 = require("../util/ftpkr_config");
const util_1 = require("../util/util");
const sm_1 = require("../util/sm");
if (process.stdin.setRawMode)
    process.stdin.setRawMode(true);
process.stdin.resume();
process.argv[0]; // node
process.argv[1]; // js
const workspaceDir = new krfile_1.File(process.argv[2] + ''); // workspaceDir
const serverIdx = +process.argv[3] | 0; // serverIndex
var onsigint = () => { };
var stream = null;
function setStream(s) {
    if (stream) {
        stream.stdout.unpipe();
        stream.stderr.unpipe();
        process.stdin.unpipe();
        stream.end();
    }
    stream = s;
    if (s) {
        s.stdout.pipe(process.stdout);
        s.stderr.pipe(process.stderr);
        process.stdin.pipe(s);
    }
}
process.stdout.on('resize', () => {
    const rows = process.stdout.rows || 0;
    const columns = process.stdout.columns || 0;
    // VSCode terminal character size: 7x17 (calculated with my screenshot!)
    if (stream)
        stream.setWindow(rows, columns, rows * 17, columns * 7);
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ftpKrConfig = new ftpkr_config_1.FtpKrConfig(workspaceDir);
            yield ftpKrConfig.readJson();
            const config = serverIdx === 0 ? ftpKrConfig : ftpKrConfig.altServer[serverIdx - 1];
            if (!config) {
                console.error("Server index overflow: " + serverIdx);
                return;
            }
            if (config.protocol !== 'sftp') {
                console.error('Need sftp protocol');
                return;
            }
            var options = {};
            if (config.privateKey) {
                var keyPath = config.privateKey;
                const keybuf = yield workspaceDir.child('.vscode', keyPath).open();
                options.privateKey = keybuf;
                options.passphrase = config.passphrase;
            }
            else {
                if (config.password)
                    options.password = config.password;
            }
            options.host = config.host;
            options.port = config.port ? config.port : 22,
                options.username = config.username;
            // options.hostVerifier = (keyHash:string) => false;
            options = util_1.merge(options, config.sftpOverride);
            for (;;) {
                if (!config.privateKey && !options.password) {
                    const password = yield new Promise((resolve, reject) => read({ prompt: "Password: ", silent: true }, (err, result) => {
                        if (err)
                            reject(err);
                        else
                            resolve(result);
                    }));
                    options.password = password;
                }
                const client = new ssh2_1.Client;
                try {
                    yield new Promise((resolve, reject) => {
                        client.on('ready', resolve)
                            .on('error', reject)
                            .connect(options);
                    });
                }
                catch (err) {
                    if (err.message === 'All configured authentication methods failed') {
                        console.error('Invalid password');
                        options.password = '';
                        client.destroy();
                        continue;
                    }
                    else {
                        throw err;
                    }
                }
                client.shell({ cols: process.stdout.columns, rows: process.stdout.rows, term: 'xterm-256color' }, (err, stream) => {
                    stream.allowHalfOpen = true;
                    stream.write(`cd ${config.remotePath}\n`);
                    setStream(stream);
                });
                yield new Promise(resolve => client.once('close', resolve));
                setStream(null);
                client.destroy();
            }
        }
        catch (err) {
            switch (err) {
                case 'NOTFOUND':
                    console.error('ftp-kr.json not found in ' + workspaceDir);
                    process.exit(-1);
                    break;
                default:
                    yield sm_1.printMappedError(err);
                    process.exit(-1);
                    break;
            }
        }
    });
}
main();
//# sourceMappingURL=ssh.js.map