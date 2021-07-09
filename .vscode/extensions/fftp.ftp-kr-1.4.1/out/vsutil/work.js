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
const log_1 = require("./log");
const ws_1 = require("./ws");
const resolvedPromise = Promise.resolve();
var TaskState;
(function (TaskState) {
    TaskState[TaskState["WAIT"] = 0] = "WAIT";
    TaskState[TaskState["STARTED"] = 1] = "STARTED";
    TaskState[TaskState["DONE"] = 2] = "DONE";
})(TaskState || (TaskState = {}));
class OnCancel {
    constructor(task, target) {
        this.task = task;
        this.target = target;
    }
    dispose() {
        if (this.target === undefined)
            return;
        this.task.removeCancelListener(this.target);
        this.target = undefined;
    }
}
exports.OnCancel = OnCancel;
class TaskImpl {
    constructor(scheduler, name, priority, task) {
        this.scheduler = scheduler;
        this.name = name;
        this.priority = priority;
        this.task = task;
        this.next = null;
        this.previous = null;
        this.cancelled = false;
        this.state = TaskState.WAIT;
        this.cancelListeners = [];
        this.logger = scheduler.logger;
        this.resolve = undefined;
        this.reject = undefined;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    setTimeLimit(timeout) {
        if (this.timeout)
            return;
        if (this.state >= TaskState.STARTED)
            return;
        this.timeout = setTimeout(() => {
            const task = this.scheduler.currentTask;
            if (task === null)
                this.logger.error(Error(`ftp-kr is busy: [null...?] is being proceesed. Cannot run [${this.name}]`));
            else
                this.logger.error(Error(`ftp-kr is busy: [${task.name}] is being proceesed. Cannot run [${this.name}]`));
            this.cancel();
        }, timeout);
    }
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state >= TaskState.STARTED) {
                throw Error('play must call once');
            }
            this.state = TaskState.STARTED;
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            if (this.cancelled)
                throw 'CANCELLED';
            this.logger.verbose(`[TASK:${this.name}] started`);
            const prom = this.task(this);
            prom.then(v => {
                this.logger.verbose(`[TASK:${this.name}] done`);
                this.resolve(v);
            }, err => {
                if (err === 'CANCELLED') {
                    this.logger.verbose(`[TASK:${this.name}] cancelled`);
                    this.reject('IGNORE');
                }
                else {
                    if (err instanceof Error) {
                        err.task = this.name;
                    }
                    this.logger.verbose(`[TASK:${this.name}] errored`);
                    this.reject(err);
                }
            });
            return yield this.promise;
        });
    }
    cancel() {
        if (this.cancelled)
            return;
        this.cancelled = true;
        if (this.state === TaskState.WAIT) {
            this.reject('IGNORE');
        }
        this.fireCancel();
    }
    with(waitWith) {
        if (this.state !== TaskState.STARTED) {
            return Promise.reject(Error('Task.with must call in task'));
        }
        if (this.cancelled)
            return Promise.reject('CANCELLED');
        return new Promise((resolve, reject) => {
            this.oncancel(() => reject('CANCELLED'));
            waitWith.then(v => {
                if (this.cancelled)
                    return;
                this.removeCancelListener(reject);
                resolve(v);
            }, err => {
                if (this.cancelled)
                    return;
                this.removeCancelListener(reject);
                reject(err);
            });
        });
    }
    oncancel(oncancel) {
        if (this.cancelled) {
            oncancel();
            return new OnCancel(this);
        }
        this.cancelListeners.push(oncancel);
        return new OnCancel(this, oncancel);
    }
    removeCancelListener(oncancel) {
        const idx = this.cancelListeners.lastIndexOf(oncancel);
        if (idx === -1)
            return false;
        this.cancelListeners.splice(idx, 1);
        return true;
    }
    checkCanceled() {
        if (this.cancelled)
            throw 'CANCELLED';
    }
    fireCancel() {
        for (const listener of this.cancelListeners) {
            listener();
        }
        this.cancelListeners.length = 0;
    }
}
class Scheduler {
    constructor(arg) {
        this.currentTask = null;
        this.nextTask = null;
        this.lastTask = null;
        this.promise = Promise.resolve();
        if (arg instanceof ws_1.Workspace) {
            this.logger = arg.query(log_1.Logger);
        }
        else {
            this.logger = arg;
        }
    }
    _addTask(task) {
        var node = this.lastTask;
        if (node) {
            if (task.priority <= node.priority) {
                node.next = task;
                task.previous = node;
                this.lastTask = task;
            }
            else {
                for (;;) {
                    const nodenext = node;
                    node = node.previous;
                    if (!node) {
                        const next = this.nextTask;
                        if (!next)
                            throw Error('Impossible');
                        task.next = next;
                        next.previous = task;
                        this.nextTask = task;
                        break;
                    }
                    if (task.priority <= node.priority) {
                        nodenext.previous = task;
                        task.next = nodenext.next;
                        task.previous = node;
                        node.next = task;
                        break;
                    }
                }
            }
        }
        else {
            this.nextTask = this.lastTask = task;
        }
    }
    dispose() {
        this.cancel();
    }
    cancel() {
        const task = this.currentTask;
        if (!task)
            return Promise.resolve();
        task.cancel();
        this.logger.message(`[${task.name}]task is cancelled`);
        var next = task.next;
        while (next) {
            this.logger.message(`[${next.name}]task is cancelled`);
            next = next.next;
        }
        task.next = null;
        this.nextTask = null;
        this.lastTask = null;
        return task.promise.catch(() => { });
    }
    taskMust(name, taskfunc, taskFrom, priority) {
        if (taskFrom) {
            return taskfunc(taskFrom);
        }
        if (priority === undefined)
            priority = exports.PRIORITY_NORMAL;
        const task = new TaskImpl(this, name, priority, taskfunc);
        this._addTask(task);
        if (!this.currentTask) {
            this.logger.verbose(`[SCHEDULAR] start`);
            this.progress();
        }
        return task.promise;
    }
    task(name, taskfunc, taskFrom, priority, timeout) {
        if (taskFrom) {
            return taskfunc(taskFrom);
        }
        if (priority === undefined)
            priority = exports.PRIORITY_NORMAL;
        if (timeout === undefined)
            timeout = 2000;
        const task = new TaskImpl(this, name, priority, taskfunc);
        task.setTimeLimit(timeout);
        this._addTask(task);
        if (!this.currentTask) {
            this.logger.verbose(`[SCHEDULAR] start`);
            this.progress();
        }
        return task.promise;
    }
    progress() {
        const task = this.nextTask;
        if (!task) {
            this.logger.verbose(`[SCHEDULAR] end`);
            this.currentTask = null;
            return;
        }
        this.currentTask = task;
        const next = task.next;
        if (next === null) {
            this.nextTask = this.lastTask = null;
        }
        else {
            this.nextTask = next;
        }
        const prom = task.play();
        prom.then(() => this.progress(), () => this.progress());
    }
}
exports.Scheduler = Scheduler;
exports.PRIORITY_HIGH = 2000;
exports.PRIORITY_NORMAL = 1000;
exports.PRIORITY_IDLE = 0;
//# sourceMappingURL=work.js.map