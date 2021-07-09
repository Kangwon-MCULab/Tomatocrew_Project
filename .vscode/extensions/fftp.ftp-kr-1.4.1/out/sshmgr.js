"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const vscode_1 = require("vscode");
const krfile_1 = require("krfile");
const vsutil_1 = require("./vsutil/vsutil");
const config_1 = require("./config");
const ssh_js = new krfile_1.File(__dirname + '/tool/ssh.js').fsPath;
function getShellType() {
    if (os.platform() !== 'win32')
        return;
    const terminalSettings = vscode_1.workspace.getConfiguration('terminal');
    var shellPath = terminalSettings.integrated.shell.windows;
    if (!shellPath)
        return undefined;
    shellPath = shellPath.toLowerCase();
    if (shellPath.endsWith('bash.exe'))
        return 'wslbash';
    if (shellPath.endsWith('cmd.exe'))
        return 'cmd';
}
function openSshTerminal(server) {
    const terminal = vscode_1.window.createTerminal(server.getName());
    var dir = server.workspace.fsPath;
    switch (getShellType()) {
        case "wslbash":
            // c:\workspace\foo to /mnt/c/workspace/foo
            dir = dir.replace(/(\w):/, '/mnt/$1').replace(/\\/g, '/');
            break;
        case "cmd":
            // send 1st two characters (drive letter and colon) to the terminal
            // so that drive letter is updated before running cd
            terminal.sendText(dir.slice(0, 2));
            break;
    }
    if (server.config.protocol !== 'sftp') {
        server.logger.errorConfirm('Cannot open SSH. Need to set protocol to sftp in ftp-kr.json', 'Open config')
            .then((res) => {
            switch (res) {
                case 'Open config':
                    vsutil_1.vsutil.open(server.workspace.query(config_1.Config).path);
                    break;
            }
        });
        return;
    }
    terminal.sendText(`node "${ssh_js}" "${dir}" ${server.config.index}`);
    terminal.show();
}
exports.openSshTerminal = openSshTerminal;
//# sourceMappingURL=sshmgr.js.map