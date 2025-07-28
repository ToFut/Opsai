"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequentialWorkflow = void 0;
const base_workflow_1 = require("./base-workflow");
class SequentialWorkflow extends base_workflow_1.BaseWorkflow {
    async execute(input) {
        console.log(`Executing sequential workflow: ${this.name}`);
        // Implementation would execute steps sequentially
        return { success: true };
    }
}
exports.SequentialWorkflow = SequentialWorkflow;
//# sourceMappingURL=sequential-workflow.js.map