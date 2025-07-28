"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseActivity = void 0;
class BaseActivity {
    constructor(name, config = {}) {
        this.name = name;
        this.config = config;
    }
    /**
     * Get activity name
     */
    getName() {
        return this.name;
    }
    /**
     * Get activity configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Validate input
     */
    validateInput(input) {
        console.log(`Validating input for activity: ${this.name}`);
        return true;
    }
}
exports.BaseActivity = BaseActivity;
//# sourceMappingURL=base-activity.js.map