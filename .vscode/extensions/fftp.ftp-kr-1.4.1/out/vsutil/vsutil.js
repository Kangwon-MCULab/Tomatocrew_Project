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
const ws_1 = require("./ws");
var context = null;
class StateBar {
    constructor(workspace) {
        this.disposed = false;
    }
    dispose() {
        if (this.disposed)
            return;
        this.close();
        this.disposed = true;
    }
    close() {
        if (this.statebar) {
            this.statebar.dispose();
            this.statebar = undefined;
        }
    }
    set(state) {
        if (this.disposed)
            return;
        if (!this.statebar)
            this.statebar = vscode_1.window.createStatusBarItem();
        this.statebar.text = state;
        this.statebar.show();
    }
}
exports.StateBar = StateBar;
class QuickPickItem {
    constructor() {
        this.label = '';
        this.description = '';
        this.onselect = () => { };
    }
}
exports.QuickPickItem = QuickPickItem;
class QuickPick {
    constructor() {
        this.items = [];
        this.oncancel = () => { };
    }
    clear() {
        this.items.length = 0;
    }
    item(label, onselect) {
        const item = new QuickPickItem();
        item.label = label;
        item.onselect = onselect;
        this.items.push(item);
        return item;
    }
    open(placeHolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const selected = yield vscode_1.window.showQuickPick(this.items, { placeHolder });
            if (selected === undefined) {
                yield this.oncancel();
            }
            else {
                yield selected.onselect();
            }
        });
    }
}
exports.QuickPick = QuickPick;
exports.vsutil = {
    createWorkspace() {
        return new Promise((resolve, reject) => {
            const pick = new QuickPick;
            if (!vscode_1.workspace.workspaceFolders) {
                reject(Error("Need workspace"));
                return;
            }
            if (vscode_1.workspace.workspaceFolders.length === 1) {
                resolve(ws_1.Workspace.createInstance(vscode_1.workspace.workspaceFolders[0]));
                return;
            }
            for (const workspaceFolder of vscode_1.workspace.workspaceFolders) {
                const fsws = ws_1.Workspace.getInstance(workspaceFolder);
                var name = workspaceFolder.name;
                if (fsws)
                    name += ' [inited]';
                pick.item(name, () => resolve(ws_1.Workspace.createInstance(workspaceFolder)));
            }
            pick.oncancel = () => resolve(undefined);
            pick.open("Select Workspace");
        });
    },
    selectWorkspace() {
        return new Promise((resolve, reject) => {
            const pick = new QuickPick;
            for (const workspaceFolder of ws_1.Workspace.all()) {
                pick.item(workspaceFolder.name, () => resolve(workspaceFolder));
            }
            if (pick.items.length === 0) {
                reject(Error("Need workspace"));
                return;
            }
            if (pick.items.length === 1) {
                pick.items[0].onselect();
                return;
            }
            pick.oncancel = () => resolve(undefined);
            pick.open("Select Workspace");
        });
    },
    info(info, ...items) {
        return vscode_1.window.showInformationMessage(info, ...items);
    },
    openWithError(path, message, line, column) {
        vscode_1.window.showErrorMessage(path + ": " + message);
        return exports.vsutil.open(path, line, column);
    },
    openUri(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof uri === 'string')
                uri = vscode_1.Uri.parse(uri);
            const doc = yield vscode_1.workspace.openTextDocument(uri);
            yield vscode_1.window.showTextDocument(doc);
        });
    },
    open(path, line, column) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield vscode_1.workspace.openTextDocument(path.fsPath);
            const editor = yield vscode_1.window.showTextDocument(doc);
            if (line !== undefined) {
                line--;
                if (column === undefined)
                    column = 0;
                const pos = new vscode_1.Position(line, column);
                editor.selection = new vscode_1.Selection(pos, pos);
                editor.revealRange(new vscode_1.Range(pos, pos));
            }
            return editor;
        });
    },
    openNew(content) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield vscode_1.workspace.openTextDocument({ content });
            vscode_1.window.showTextDocument(doc);
            return doc;
        });
    },
    diff(left, right, title) {
        return new Promise(resolve => {
            const leftUri = vscode_1.Uri.file(left.fsPath);
            const rightUri = vscode_1.Uri.file(right.fsPath);
            var options;
            vscode_1.commands.executeCommand('vscode.diff', leftUri, rightUri, title).then((res) => {
                const dispose = vscode_1.workspace.onDidCloseTextDocument(e => {
                    if (e.uri.fsPath === left.fsPath) {
                        dispose.dispose();
                        resolve();
                        return;
                    }
                });
            });
        });
    },
};
//# sourceMappingURL=vsutil.js.map