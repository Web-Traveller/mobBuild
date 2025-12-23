import { AppDefinition } from './app';

export interface GeneratorContext {
  appDefinition: AppDefinition;
  outputPath: string;
  options?: GeneratorOptions;
}

export interface GeneratorOptions {
  overwrite?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: FileType;
}

export enum FileType {
  SOURCE = 'source',
  CONFIG = 'config',
  SCHEMA = 'schema',
  TEST = 'test',
  DOCUMENTATION = 'documentation',
}

export interface GeneratorResult {
  success: boolean;
  files: GeneratedFile[];
  errors?: GeneratorError[];
  warnings?: string[];
}

export interface GeneratorError {
  message: string;
  file?: string;
  line?: number;
  severity: 'error' | 'warning';
}

export interface CodeGenerator {
  generate(context: GeneratorContext): Promise<GeneratorResult>;
  validate(context: GeneratorContext): boolean;
}

// ===========================
// New Orchestration Generator Types
// ===========================

import { OrchestrationContext } from './app';

// Base code generator interface for orchestration
export interface OrchestrationCodeGenerator {
  name: string;
  generate(context: OrchestrationContext): Promise<Record<string, string>>;
  validate(context: OrchestrationContext): Promise<boolean>;
}

// Generator results for orchestration
export interface OrchestrationGeneratorResult {
  success: boolean;
  files: Record<string, string>;
  errors?: string[];
  warnings?: string[];
}
