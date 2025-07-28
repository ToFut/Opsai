"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWorkflow = void 0;
class BaseWorkflow {
    constructor(id, name, config = {}) {
        this.id = id;
        this.name = name;
        this.config = config;
    }
    /**
     * Get workflow ID
     */
    getId() {
        return this.id;
    }
    /**
     * Get workflow name
     */
    getName() {
        return this.name;
    }
    /**
     * Get workflow configuration
     */
    getConfig() {
        return this.config;
    }
}
exports.BaseWorkflow = BaseWorkflow;
//# sourceMappingURL=base-workflow.js.map