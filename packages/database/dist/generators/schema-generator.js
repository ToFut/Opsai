"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaGenerator = void 0;
class SchemaGenerator {
    constructor() {
        this.models = [];
        this.enums = [];
        this.datasources = [];
        this.generators = [];
    }
    addModel(model) {
        this.models.push(model);
    }
    addEnum(enumDef) {
        this.enums.push(enumDef);
    }
    addDatasource(datasource) {
        this.datasources.push(datasource);
    }
    addGenerator(generator) {
        this.generators.push(generator);
    }
    generateSchema() {
        return {
            models: this.models,
            enums: this.enums,
            datasources: this.datasources,
            generators: this.generators
        };
    }
    generatePrismaSchema() {
        let schema = '';
        // Add datasources
        for (const datasource of this.datasources) {
            schema += `datasource ${datasource.name} {\n`;
            schema += `  provider = "${datasource.provider}"\n`;
            schema += `  url      = env("${datasource.url}")\n`;
            schema += '}\n\n';
        }
        // Add generators
        for (const generator of this.generators) {
            schema += `generator ${generator.name} {\n`;
            schema += `  provider = "${generator.provider}"\n`;
            if (generator.output) {
                schema += `  output   = "${generator.output}"\n`;
            }
            schema += '}\n\n';
        }
        // Add enums
        for (const enumDef of this.enums) {
            schema += `enum ${enumDef.name} {\n`;
            for (const value of enumDef.values) {
                schema += `  ${value}\n`;
            }
            schema += '}\n\n';
        }
        // Add models
        for (const model of this.models) {
            schema += `model ${model.name} {\n`;
            for (const field of model.fields) {
                let fieldDef = `  ${field.name}  ${this.mapFieldType(field.type)}`;
                if (field.isRequired || field.required) {
                    fieldDef += ' @required';
                }
                if (field.isUnique || field.unique) {
                    fieldDef += ' @unique';
                }
                if (field.isPrimary) {
                    fieldDef += ' @id';
                }
                if (field.defaultValue !== undefined) {
                    fieldDef += ` @default(${field.defaultValue})`;
                }
                if (field.relationName) {
                    fieldDef += ` @relation(name: "${field.relationName}")`;
                }
                schema += fieldDef + '\n';
            }
            schema += '}\n\n';
        }
        return schema;
    }
    mapFieldType(yamlType) {
        const typeMap = {
            'string': 'String',
            'number': 'Float',
            'integer': 'Int',
            'boolean': 'Boolean',
            'date': 'DateTime',
            'datetime': 'DateTime',
            'json': 'Json',
            'enum': 'String'
        };
        return typeMap[yamlType] || 'String';
    }
    clear() {
        this.models = [];
        this.enums = [];
        this.datasources = [];
        this.generators = [];
    }
}
exports.SchemaGenerator = SchemaGenerator;
//# sourceMappingURL=schema-generator.js.map