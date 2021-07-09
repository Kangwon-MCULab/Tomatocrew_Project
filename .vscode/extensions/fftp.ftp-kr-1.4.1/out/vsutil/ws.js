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
const event_1 = require("../util/event");
const vscode_1 = require("vscode");
const krfile_1 = require("krfile");
var WorkspaceOpenState;
(function (WorkspaceOpenState) {
    WorkspaceOpenState[WorkspaceOpenState["CREATED"] = 0] = "CREATED";
    WorkspaceOpenState[WorkspaceOpenState["OPENED"] = 1] = "OPENED";
})(WorkspaceOpenState = exports.WorkspaceOpenState || (exports.WorkspaceOpenState = {}));
class Workspace extends krfile_1.File {
    constructor(workspaceFolder, openState) {
        super(workspaceFolder.uri.fsPath);
        this.workspaceFolder = workspaceFolder;
        this.openState = openState;
        this.items = new Map;
        this.name = workspaceFolder.name;
    }
    query(type) {
        var item = this.items.get(type);
        if (item === undefined) {
            item = new type(this);
            this.items.set(type, item);
        }
        return item;
    }
    dispose() {
        for (const item of this.items.values()) {
            item.dispose();
        }
        this.items.clear();
    }
    static getInstance(workspace) {
        return Workspace.wsmap.get(workspace.uri.fsPath);
    }
    static createInstance(workspaceFolder) {
        const workspacePath = workspaceFolder.uri.fsPath;
        var fsws = Workspace.wsmap.get(workspacePath);
        if (fsws)
            return fsws;
        Workspace.wsloading.delete(workspacePath);
        fsws = new Workspace(workspaceFolder, WorkspaceOpenState.CREATED);
        Workspace.wsmap.set(workspacePath, fsws);
        Workspace.onNew.fire(fsws);
        return fsws;
    }
    static load(workspaceFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fsws = new Workspace(workspaceFolder, WorkspaceOpenState.OPENED);
                const workspacePath = workspaceFolder.uri.fsPath;
                if (Workspace.wsloading.has(workspacePath))
                    return;
                Workspace.wsloading.set(workspacePath, fsws);
                const existed = yield fsws.child('.vscode/ftp-kr.json').exists();
                if (!Workspace.wsloading.has(workspacePath))
                    return;
                Workspace.wsloading.delete(workspacePath);
                if (existed) {
                    Workspace.wsmap.set(workspacePath, fsws);
                    yield Workspace.onNew.fire(fsws);
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    static unload(workspaceFolder) {
        const workspacePath = workspaceFolder.uri.fsPath;
        Workspace.wsloading.delete(workspacePath);
        const ws = Workspace.wsmap.get(workspacePath);
        if (ws) {
            ws.dispose();
            Workspace.wsmap.delete(workspacePath);
        }
    }
    static loadAll() {
        workspaceWatcher = vscode_1.workspace.onDidChangeWorkspaceFolders(e => {
            for (const ws of e.added) {
                Workspace.load(ws);
            }
            for (const ws of e.removed) {
                Workspace.unload(ws);
            }
        });
        if (vscode_1.workspace.workspaceFolders) {
            for (const ws of vscode_1.workspace.workspaceFolders) {
                Workspace.load(ws);
            }
        }
    }
    static unloadAll() {
        if (workspaceWatcher) {
            workspaceWatcher.dispose();
            workspaceWatcher = undefined;
        }
        for (const ws of Workspace.wsmap.values()) {
            ws.dispose();
        }
        Workspace.wsmap.clear();
        Workspace.wsloading.clear();
    }
    static first() {
        if (vscode_1.workspace.workspaceFolders) {
            for (const ws of vscode_1.workspace.workspaceFolders) {
                const fsws = Workspace.wsmap.get(ws.uri.fsPath);
                if (!fsws)
                    continue;
                return fsws;
            }
        }
        throw Error("Need workspace");
    }
    static *all() {
        if (vscode_1.workspace.workspaceFolders) {
            for (const ws of vscode_1.workspace.workspaceFolders) {
                const fsws = Workspace.wsmap.get(ws.uri.fsPath);
                if (fsws)
                    yield fsws;
            }
        }
    }
    static one() {
        if (Workspace.wsmap.size === 1)
            return Workspace.wsmap.values().next().value;
        return undefined;
    }
    static fromFile(file) {
        const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(vscode_1.Uri.file(file.fsPath));
        if (!workspaceFolder)
            throw Error(file.fsPath + " is not in workspace");
        const fsworkspace = Workspace.getInstance(workspaceFolder);
        if (!fsworkspace)
            throw Error(file.fsPath + " ftp-kr is not inited");
        return fsworkspace;
    }
}
Workspace.wsmap = new Map();
Workspace.wsloading = new Map();
Workspace.onNew = event_1.Event.make('onNew', false);
exports.Workspace = Workspace;
var workspaceWatcher;
//# sourceMappingURL=ws.js.map