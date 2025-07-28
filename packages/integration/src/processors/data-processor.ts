import { TransformationRule, DataMapping } from '../types';
import { IntegrationError } from '../errors';

export class DataProcessor {
  /**
   * Process data transformations
   */
  async processTransformations(
    data: any,
    transformations: TransformationRule[],
    tenantId: string
  ): Promise<any> {
    let processedData = data;

    for (const transformation of transformations.filter(t => t.enabled)) {
      try {
        processedData = await this.applyTransformation(processedData, transformation);
      } catch (error) {
        console.error(`Transformation '${transformation.name}' failed:`, error);
        throw new IntegrationError(
          `Transformation failed: ${transformation.name}`,
          'TRANSFORMATION_FAILED',
          error
        );
      }
    }

    return processedData;
  }

  /**
   * Apply data mappings
   */
  applyDataMappings(data: any, mappings: DataMapping[]): any {
    const result: any = {};

    for (const mapping of mappings) {
      try {
        switch (mapping.type) {
          case 'direct':
            result[mapping.target] = this.getNestedValue(data, mapping.source);
            break;
          case 'default':
            result[mapping.target] = this.getNestedValue(data, mapping.source) || mapping.defaultValue;
            break;
          case 'transform':
            const sourceValue = this.getNestedValue(data, mapping.source);
            result[mapping.target] = this.applyTransformRule(sourceValue, mapping.transformRule!);
            break;
        }
      } catch (error) {
        console.error(`Mapping failed for ${mapping.source} -> ${mapping.target}:`, error);
        if (mapping.type === 'default') {
          result[mapping.target] = mapping.defaultValue;
        }
      }
    }

    return result;
  }

  /**
   * Validate data against schema
   */
  validateData(data: any, schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema || !schema.properties) {
      return { valid: true, errors: [] };
    }

    // Basic validation - in production, use a proper JSON schema validator
    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      const fieldValue = data[fieldName];
      const field = fieldSchema as any;

      // Check required fields
      if (schema.required?.includes(fieldName) && (fieldValue === undefined || fieldValue === null)) {
        errors.push(`Required field '${fieldName}' is missing`);
        continue;
      }

      // Skip validation if field is not present and not required
      if (fieldValue === undefined || fieldValue === null) {
        continue;
      }

      // Type validation
      if (field.type) {
        const actualType = Array.isArray(fieldValue) ? 'array' : typeof fieldValue;
        if (field.type !== actualType) {
          errors.push(`Field '${fieldName}' should be of type '${field.type}', got '${actualType}'`);
        }
      }

      // String validations
      if (field.type === 'string') {
        if (field.minLength && fieldValue.length < field.minLength) {
          errors.push(`Field '${fieldName}' should be at least ${field.minLength} characters long`);
        }
        if (field.maxLength && fieldValue.length > field.maxLength) {
          errors.push(`Field '${fieldName}' should be at most ${field.maxLength} characters long`);
        }
        if (field.pattern && !new RegExp(field.pattern).test(fieldValue)) {
          errors.push(`Field '${fieldName}' does not match required pattern`);
        }
      }

      // Number validations
      if (field.type === 'number' || field.type === 'integer') {
        if (field.minimum !== undefined && fieldValue < field.minimum) {
          errors.push(`Field '${fieldName}' should be at least ${field.minimum}`);
        }
        if (field.maximum !== undefined && fieldValue > field.maximum) {
          errors.push(`Field '${fieldName}' should be at most ${field.maximum}`);
        }
      }

      // Array validations
      if (field.type === 'array') {
        if (field.minItems && fieldValue.length < field.minItems) {
          errors.push(`Field '${fieldName}' should have at least ${field.minItems} items`);
        }
        if (field.maxItems && fieldValue.length > field.maxItems) {
          errors.push(`Field '${fieldName}' should have at most ${field.maxItems} items`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform data format (JSON, XML, CSV, etc.)
   */
  async transformFormat(data: any, fromFormat: string, toFormat: string): Promise<any> {
    switch (`${fromFormat}->${toFormat}`) {
      case 'xml->json':
        return this.xmlToJson(data);
      case 'json->xml':
        return this.jsonToXml(data);
      case 'csv->json':
        return this.csvToJson(data);
      case 'json->csv':
        return this.jsonToCsv(data);
      default:
        throw new IntegrationError(`Unsupported format transformation: ${fromFormat} -> ${toFormat}`);
    }
  }

  /**
   * Paginate data processing
   */
  async processPaginated<T>(
    data: T[],
    processor: (batch: T[]) => Promise<void>,
    batchSize: number = 100
  ): Promise<void> {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await processor(batch);
    }
  }

  /**
   * Apply transformation rule
   */
  private async applyTransformation(data: any, transformation: TransformationRule): Promise<any> {
    // Validate input against input schema
    const inputValidation = this.validateData(data, transformation.inputSchema);
    if (!inputValidation.valid) {
      throw new IntegrationError(
        `Input validation failed: ${inputValidation.errors.join(', ')}`
      );
    }

    // Apply transformation function
    let result;
    try {
      // In a real implementation, this would be a secure sandbox
      // For now, we'll use a simple function evaluation
      const transformFunction = new Function('data', transformation.transformFunction);
      result = transformFunction(data);
    } catch (error) {
      throw new IntegrationError(
        `Transformation function execution failed: ${error}`,
        'TRANSFORM_EXECUTION_FAILED',
        error
      );
    }

    // Validate output against output schema
    const outputValidation = this.validateData(result, transformation.outputSchema);
    if (!outputValidation.valid) {
      throw new IntegrationError(
        `Output validation failed: ${outputValidation.errors.join(', ')}`
      );
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Apply transform rule to value
   */
  private applyTransformRule(value: any, rule: string): any {
    // Simple transform rules - in production, this would be more sophisticated
    switch (rule) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'toString':
        return String(value);
      case 'toNumber':
        return typeof value === 'string' ? parseFloat(value) : value;
      case 'toBoolean':
        return Boolean(value);
      case 'toDate':
        return new Date(value);
      default:
        // Try to evaluate as JavaScript expression
        try {
          const func = new Function('value', `return ${rule}`);
          return func(value);
        } catch {
          return value; // Return original value if transformation fails
        }
    }
  }

  /**
   * Convert XML to JSON
   */
  private async xmlToJson(xmlData: string): Promise<any> {
    // In production, use a proper XML parser like xml2js
    throw new IntegrationError('XML to JSON conversion not implemented');
  }

  /**
   * Convert JSON to XML
   */
  private jsonToXml(jsonData: any): string {
    // In production, use a proper JSON to XML converter
    throw new IntegrationError('JSON to XML conversion not implemented');
  }

  /**
   * Convert CSV to JSON
   */
  private async csvToJson(csvData: string): Promise<any[]> {
    const lines = csvData.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      result.push(row);
    }

    return result;
  }

  /**
   * Convert JSON to CSV
   */
  private jsonToCsv(jsonData: any[]): string {
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return '';
    }

    const headers = Object.keys(jsonData[0]);
    const csvLines = [headers.join(',')];

    for (const row of jsonData) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value || '');
      });
      csvLines.push(values.join(','));
    }

    return csvLines.join('\n');
  }
} 