"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const cmd_1 = require("./vsutil/cmd");
const ws_1 = require("./vsutil/ws");
const watcher_1 = require("./watcher");
const config_1 = require("./config");
const ftpdown_1 = require("./ftpdown");
const config_2 = require("./cmd/config");
const ftpsync_1 = require("./cmd/ftpsync");
const ftptree_1 = require("./ftptree");
ws_1.Workspace.onNew(workspace => {
    workspace.query(watcher_1.WorkspaceWatcher);
    workspace.query(config_1.Config);
    workspace.query(ftpdown_1.FtpDownloader);
});
function activate(context) {
    console.log('[extension: ftp-kr] activate');
    cmd_1.Command.register(context, config_2.commands, ftpsync_1.commands);
    ws_1.Workspace.loadAll();
    vscode_1.workspace.registerTextDocumentContentProvider('sftp', ftptree_1.ftpTree.getContentProvider('sftp'));
    vscode_1.workspace.registerTextDocumentContentProvider('ftp', ftptree_1.ftpTree.getContentProvider('ftp'));
    vscode_1.workspace.registerTextDocumentContentProvider('ftps', ftptree_1.ftpTree.getContentProvider('ftps'));
    vscode_1.window.registerTreeDataProvider('ftpkr.explorer', ftptree_1.ftpTree);
}
exports.activate = activate;
function deactivate() {
    try {
        ws_1.Workspace.unloadAll();
        console.log('[extension: ftp-kr] deactivate');
    }
    catch (err) {
        console.error(err);
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=index.js.map