import { TransformationRule, DataMapping } from '../types';
export declare class DataProcessor {
    /**
     * Process data transformations
     */
    processTransformations(data: any, transformations: TransformationRule[], tenantId: string): Promise<any>;
    /**
     * Apply data mappings
     */
    applyDataMappings(data: any, mappings: DataMapping[]): any;
    /**
     * Validate data against schema
     */
    validateData(data: any, schema: any): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Transform data format (JSON, XML, CSV, etc.)
     */
    transformFormat(data: any, fromFormat: string, toFormat: string): Promise<any>;
    /**
     * Paginate data processing
     */
    processPaginated<T>(data: T[], processor: (batch: T[]) => Promise<void>, batchSize?: number): Promise<void>;
    /**
     * Apply transformation rule
     */
    private applyTransformation;
    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue;
    /**
     * Apply transform rule to value
     */
    private applyTransformRule;
    /**
     * Convert XML to JSON
     */
    private xmlToJson;
    /**
     * Convert JSON to XML
     */
    private jsonToXml;
    /**
     * Convert CSV to JSON
     */
    private csvToJson;
    /**
     * Convert JSON to CSV
     */
    private jsonToCsv;
}
//# sourceMappingURL=data-processor.d.ts.map