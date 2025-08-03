import { OpenAI } from 'openai';
import { FileManager } from '../file-manager';
import { ComponentAnalyzer } from '../analyzers/component-analyzer';

export interface CodeGenerationRequest {
  filePath: string;
  modification: string;
  context: {
    currentCode: string;
    appStructure: any;
    userIntent: string;
  };
}

export interface GeneratedCode {
  code: string;
  explanation: string;
  filesModified: string[];
  previewUrl?: string;
}

export class AICodeGenerator {
  private openai: OpenAI;
  private fileManager: FileManager;
  private componentAnalyzer: ComponentAnalyzer;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.fileManager = new FileManager();
    this.componentAnalyzer = new ComponentAnalyzer();
  }

  async generateComponentModification(request: CodeGenerationRequest): Promise<GeneratedCode> {
    const prompt = this.buildModificationPrompt(request);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert React/Next.js developer. Modify the code based on the user's request while maintaining:
          - Existing functionality
          - Code style consistency
          - Type safety
          - Best practices
          
          Return only the modified code, no explanations.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    });

    const generatedCode = response.choices[0].message.content;
    
    return {
      code: generatedCode!,
      explanation: `Modified ${request.filePath} based on: ${request.modification}`,
      filesModified: [request.filePath]
    };
  }

  async generateNewComponent(componentType: string, requirements: string): Promise<GeneratedCode> {
    const prompt = `Create a new ${componentType} component with these requirements: ${requirements}
    
    Use modern React patterns, TypeScript, and Tailwind CSS. Include proper types and documentation.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert React component developer. Create clean, reusable components."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4
    });

    return {
      code: response.choices[0].message.content!,
      explanation: `Generated new ${componentType} component`,
      filesModified: [`components/${componentType}.tsx`]
    };
  }

  private buildModificationPrompt(request: CodeGenerationRequest): string {
    return `
    Current file: ${request.filePath}
    Current code:
    \`\`\`tsx
    ${request.context.currentCode}
    \`\`\`
    
    User request: ${request.modification}
    App structure: ${JSON.stringify(request.context.appStructure, null, 2)}
    
    Modify the code to implement the user's request. Maintain existing functionality and style.
    `;
  }
} 