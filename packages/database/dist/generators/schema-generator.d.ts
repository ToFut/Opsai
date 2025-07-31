import { DatabaseModel as Model } from '@opsai/shared';
export interface PrismaSchema {
    models: Model[];
    enums: any[];
    datasources: any[];
    generators: any[];
}
export declare class SchemaGenerator {
    private models;
    private enums;
    private datasources;
    private generators;
    addModel(model: Model): void;
    addEnum(enumDef: any): void;
    addDatasource(datasource: any): void;
    addGenerator(generator: any): void;
    generateSchema(): PrismaSchema;
    generatePrismaSchema(): string;
    private mapFieldType;
    clear(): void;
}
//# sourceMappingURL=schema-generator.d.ts.map