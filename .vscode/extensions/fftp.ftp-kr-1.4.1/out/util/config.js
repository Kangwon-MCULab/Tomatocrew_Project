"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConfigContainer {
    constructor(properties) {
        this.properties = new Set(properties);
        Object.freeze(this.properties);
    }
    isProperty(name) {
        return this.properties.has(name);
    }
    clearConfig() {
        for (const name of this.properties) {
            delete this[name];
        }
    }
    appendConfig(config) {
        for (const p in config) {
            if (!this.isProperty(p))
                continue;
            this[p] = config[p];
        }
    }
}
exports.ConfigContainer = ConfigContainer;
//# sourceMappingURL=config.js.map