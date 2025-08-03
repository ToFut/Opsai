"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataDiscoveryService = void 0;
// Integration services
__exportStar(require("./services/integration-service"), exports);
__exportStar(require("./services/sync-service"), exports);
__exportStar(require("./services/webhook-service"), exports);
__exportStar(require("./services/data-discovery-service"), exports);
// Connectors
__exportStar(require("./connectors/base-connector"), exports);
__exportStar(require("./connectors/rest-connector"), exports);
__exportStar(require("./connectors/soap-connector"), exports);
__exportStar(require("./connectors/webhook-connector"), exports);
__exportStar(require("./connectors/airbyte-connector"), exports);
// Processors
__exportStar(require("./processors/data-processor"), exports);
__exportStar(require("./processors/transformation-processor"), exports);
// Authentication
__exportStar(require("./auth/oauth-manager"), exports);
__exportStar(require("./credentials/credential-manager"), exports);
// Types
__exportStar(require("./types"), exports);
// Re-export shared discovery types from services
var data_discovery_service_1 = require("./services/data-discovery-service");
Object.defineProperty(exports, "DataDiscoveryService", { enumerable: true, get: function () { return data_discovery_service_1.DataDiscoveryService; } });
//# sourceMappingURL=index.js.map