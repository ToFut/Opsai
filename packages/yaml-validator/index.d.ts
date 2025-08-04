export interface YAMLConfig {
  [key: string]: any;
}

export function validateYAML(yaml: string): YAMLConfig;
export function parseYAML(yaml: string): YAMLConfig;