import { TransformationRule } from '../types';
export declare class TransformationProcessor {
    /**
     * Apply transformation rules
     */
    applyTransformations(data: any, _rules: TransformationRule[]): any;
    /**
     * Create transformation rule
     */
    createTransformationRule(rule: Omit<TransformationRule, 'enabled'>): TransformationRule;
    /**
     * Validate transformation rule
     */
    validateTransformationRule(_rule: TransformationRule): boolean;
}
//# sourceMappingURL=transformation-processor.d.ts.map