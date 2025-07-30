"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseConnector = void 0;
class BaseConnector {
    dispose() {
        throw new Error('Method not implemented.');
    }
    constructor(config) {
        this.config = config;
    }
    /**
     * Get connector capabilities
     */
    getCapabilities() {
        return this.config.capabilities;
    }
    /**
     * Get connector version
     */
    getVersion() {
        return this.config.version;
    }
}
exports.BaseConnector = BaseConnector;
//# sourceMappingURL=base-connector.js.map